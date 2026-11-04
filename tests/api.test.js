/**
 * End-to-end API tests: real Express app + real Nodemailer + an in-process
 * SMTP server that captures and parses the owner notification e-mail.
 *   npm test
 */
'use strict';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const LOG_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vb-logs-'));
Object.assign(process.env, {
  NODE_ENV: 'test',
  LOG_DIR,
  RATE_LIMIT_MAX: '1000',
  MIN_FORM_FILL_MS: '3000'
});

const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const { createApp } = require('../server');
const duplicates = require('../utils/duplicateGuard');
const catalog = require('../shared/catalog');

let smtp, smtpPort, http, base;
let inbox = [];

function setMailEnv(overrides = {}) {
  Object.assign(process.env, {
    OWNER_EMAIL: 'owner@caliber.test',
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(smtpPort),
    SMTP_USER: 'mailer',
    SMTP_PASS: 'secret',
    SMTP_SECURE: 'false',
    SMTP_IGNORE_TLS: 'true',
    SMTP_REQUIRE_TLS: 'false',
    MAIL_FROM: 'Vision Board <no-reply@caliber.test>',
    OWNER_TIMEZONE: 'America/Denver',
    ...overrides
  });
}

before(async () => {
  smtp = new SMTPServer({
    disabledCommands: ['STARTTLS'],
    allowInsecureAuth: true,
    logger: false,
    onAuth(auth, s, cb) {
      if (auth.username === 'mailer' && auth.password === 'secret') return cb(null, { user: 'mailer' });
      return cb(new Error('Invalid login'));
    },
    onData(stream, s, cb) {
      simpleParser(stream, { keepCidLinks: true }).then((m) => { inbox.push(m); cb(); }).catch(cb);
    }
  });
  await new Promise((r) => smtp.listen(0, '127.0.0.1', r));
  smtpPort = smtp.server.address().port;

  http = createApp().listen(0, '127.0.0.1');
  await new Promise((r) => http.once('listening', r));
  base = `http://127.0.0.1:${http.address().port}`;
});

after(async () => {
  await new Promise((r) => http.close(r));
  await new Promise((r) => smtp.close(r));
});

beforeEach(() => {
  inbox = [];
  duplicates._reset();
  setMailEnv();
});

function fullBoard() {
  return {
    picks: {
      shower: 'neo-angle-shower',
      wallPattern: 'chevron',
      wallColor: 'calcutta-marble',
      flooring: 'porcelain-marble-look',
      vanity: 'shaker-navy',
      countertop: 'quartz-black',
      showerDoor: 'framed',
      faucet: 'brushed-bronzed-gold',
      mirror: 'round-pill',
      accessories: ['recessed-niche', 'rainfall-head']
    },
    sub: { etch: 'grayline', glass: 'frost', vgroove: 'arrow' },
    accessible: false,
    preset: 'spa-retreat'
  };
}

function validBody(extra = {}) {
  return {
    submissionId: crypto.randomUUID(),
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'Jane.Smith@Example.com',
    phone: '208 555 0142',
    zip: '83702',
    city: 'Boise',
    state: 'id',
    bestTime: 'afternoon',
    interests: ['walk-in-shower', 'stair-lift'],
    website: '',
    formStartedAt: Date.now() - 60000,
    board: fullBoard(),
    shareUrl: 'http://localhost:3000/#/summary?b=abc123',
    pageUrl: 'http://localhost:3000/',
    ...extra
  };
}

const post = (body) => fetch(`${base}/api/submit-form`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'User-Agent': 'vb-test' },
  body: typeof body === 'string' ? body : JSON.stringify(body)
});

test('valid submission e-mails the owner with every field and selection', async () => {
  const res = await post(validBody());
  const json = await res.json();
  assert.equal(res.status, 200, JSON.stringify(json));
  assert.equal(json.ok, true);
  assert.match(json.reference, /^[0-9a-f-]{36}$/);

  assert.equal(inbox.length, 1, 'exactly one e-mail');
  const mail = inbox[0];
  assert.match(mail.subject, /^New Form Submission – Website Inquiry/);
  assert.match(mail.subject, /Jane Smith/);
  assert.equal(mail.to.text, 'owner@caliber.test');
  assert.match(mail.replyTo.text, /jane\.smith@example\.com/);

  const html = mail.html;
  const text = mail.text;
  for (const body of [html, text]) {
    // customer fields
    for (const s of ['Walk-in shower, Stair lift', 'Jane Smith', 'jane.smith@example.com', '(208) 555-0142', 'Boise', 'ID', '83702', 'Afternoon']) {
      assert.ok(body.includes(s), `missing "${s}"`);
    }
    // every category + its chosen value
    for (const s of ['Shower / Tub Style', 'Neo-Angle Shower', 'Wall Pattern', 'Chevron', 'Wall Color', 'Calcutta Marble',
      'Flooring', 'Porcelain Marble-Look', 'Vanity', 'Shaker Navy', 'Countertop', 'Quartz Black', 'Shower Door', 'Framed',
      'Faucet', 'Brushed / Bronzed Gold', 'Mirror', 'Round / Pill', 'Accessories', 'Recessed Niche, Rainfall Head']) {
      assert.ok(body.includes(s.replace('&', '&amp;')) || body.includes(s), `missing selection "${s}"`);
    }
    // sub-options
    for (const s of ['Grayline', 'Frost', 'Arrow']) assert.ok(body.includes(s), `missing sub-option "${s}"`);
    // extras + metadata
    for (const s of ['Spa Retreat', '10 of 10', 'Reference']) assert.ok(body.includes(s), `missing "${s}"`);
  }
  assert.ok(html.includes('http://localhost:3000/#/summary?b=abc123'), 'share link');
  assert.match(text, /Submitted:\s+\w+day, \w+ \d+, \d{4}/, 'submission date/time');
  assert.match(html, /M[SD]T/, 'owner time zone shown');

  // inline images for selections + JSON copy
  const inline = mail.attachments.filter((a) => a.cid);
  assert.equal(inline.length, 11, 'one image per selected option (9 singles + 2 accessories)');
  for (const a of inline) assert.ok(html.includes(`cid:${a.cid}`), `image ${a.cid} referenced`);
  const jsonAtt = mail.attachments.find((a) => a.contentType === 'application/json');
  assert.ok(jsonAtt, 'json attachment');
  const data = JSON.parse(jsonAtt.content.toString());
  assert.equal(data.customer.fullName, 'Jane Smith');
  assert.equal(data.selections.length, 10);
});

test('skipped and missing categories are reported clearly', async () => {
  const board = fullBoard();
  board.picks.countertop = catalog.SKIP;
  board.picks.mirror = null;
  board.picks.accessories = [];
  const res = await post(validBody({ board }));
  assert.equal(res.status, 200);
  const t = inbox[0].text;
  assert.match(t, /Countertop: Not in my project \(skipped\)/);
  assert.match(t, /Mirror: Not chosen/);
  assert.match(t, /Accessories: Not chosen/);
  assert.match(t, /8 of 10/);
});

test('missing required fields -> 422 with a message per field, no e-mail', async () => {
  const res = await post(validBody({ firstName: '', lastName: '', email: '', phone: '', zip: '', city: '', state: '' }));
  const json = await res.json();
  assert.equal(res.status, 422);
  assert.equal(json.ok, false);
  const fields = json.errors.map((e) => e.field).sort();
  assert.deepEqual(fields, ['city', 'email', 'firstName', 'lastName', 'phone', 'state', 'zip']);
  assert.equal(inbox.length, 0);
});

test('invalid email / phone / zip / state -> 422', async () => {
  const res = await post(validBody({ email: 'jane@', phone: '555-01', zip: '8150', state: 'XX' }));
  const json = await res.json();
  assert.equal(res.status, 422);
  const byField = Object.fromEntries(json.errors.map((e) => [e.field, e.message]));
  assert.match(byField.email, /valid email/);
  assert.match(byField.phone, /10-digit/);
  assert.match(byField.zip, /zip/);
  assert.match(byField.state, /2-letter/);
  assert.equal(inbox.length, 0);
});

test('tampered board option -> 422', async () => {
  const board = fullBoard();
  board.picks.vanity = '<script>alert(1)</script>';
  const res = await post(validBody({ board }));
  assert.equal(res.status, 422);
  assert.equal(inbox.length, 0);
});

test('unknown interest -> 422', async () => {
  const res = await post(validBody({ interests: ['jacuzzi-party'] }));
  const json = await res.json();
  assert.equal(res.status, 422);
  assert.ok(json.errors.some((e) => e.field === 'interests'));
  assert.equal(inbox.length, 0);
});

test('interests are optional', async () => {
  const body = validBody();
  delete body.interests;
  const res = await post(body);
  assert.equal(res.status, 200);
  assert.match(inbox[0].text, /Interested In:\s+Not specified/);
});

test('empty board -> 422', async () => {
  const res = await post(validBody({ board: { picks: {} } }));
  const json = await res.json();
  assert.equal(res.status, 422);
  assert.match(json.message, /at least one/);
});

test('user input is HTML-escaped in the e-mail', async () => {
  const res = await post(validBody({ lastName: "O'Brien-<b>" }));
  // "<" is not allowed in names -> rejected
  assert.equal(res.status, 422);
  const ok = await post(validBody({ lastName: "O'Brien" }));
  assert.equal(ok.status, 200);
  assert.ok(inbox[0].html.includes('O&#39;Brien'));
});

test('honeypot filled -> 400, no e-mail', async () => {
  const res = await post(validBody({ website: 'http://spam.example' }));
  assert.equal(res.status, 400);
  assert.equal(inbox.length, 0);
});

test('submitted too fast -> 400, no e-mail', async () => {
  const res = await post(validBody({ formStartedAt: Date.now() - 500 }));
  assert.equal(res.status, 400);
  assert.equal(inbox.length, 0);
});

test('duplicate submission (same id or same content) sends only one e-mail', async () => {
  const body = validBody();
  const first = await post(body);
  assert.equal(first.status, 200);
  const again = await post(body);
  const againJson = await again.json();
  assert.equal(again.status, 200);
  assert.equal(againJson.duplicate, true);
  const newId = await post({ ...body, submissionId: crypto.randomUUID() });
  assert.equal((await newId.json()).duplicate, true);
  assert.equal(inbox.length, 1);
});

test('SMTP failure -> 502, never a success, lead saved for recovery', async () => {
  setMailEnv({ SMTP_PORT: '1' }); // nothing listens there
  const body = validBody();
  const res = await post(body);
  const json = await res.json();
  assert.equal(res.status, 502);
  assert.equal(json.ok, false);
  assert.equal(inbox.length, 0);
  await new Promise((r) => setTimeout(r, 100));
  const failed = fs.readFileSync(path.join(LOG_DIR, 'failed-submissions.jsonl'), 'utf8');
  assert.ok(failed.includes(body.submissionId));

  // after the outage the same submission can be retried successfully
  setMailEnv();
  const retry = await post(body);
  assert.equal(retry.status, 200);
  assert.equal(inbox.length, 1);
});

test('SMTP auth rejected -> 502', async () => {
  setMailEnv({ SMTP_PASS: 'wrong' });
  const res = await post(validBody());
  assert.equal(res.status, 502);
  assert.equal(inbox.length, 0);
});

test('e-mail not configured -> 503', async () => {
  setMailEnv({ OWNER_EMAIL: '' });
  const res = await post(validBody());
  assert.equal(res.status, 503);
  assert.equal((await res.json()).ok, false);
});

test('malformed JSON -> 400', async () => {
  const res = await post('{"firstName":');
  assert.equal(res.status, 400);
});

test('submission log records outcomes', async () => {
  await post(validBody());
  await new Promise((r) => setTimeout(r, 100));
  const log = fs.readFileSync(path.join(LOG_DIR, 'submissions.log'), 'utf8');
  assert.match(log, /"msg":"submission sent"/);
});

test('frontend and shared catalog are served; secrets are not', async () => {
  const page = await fetch(`${base}/`);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Aging-in-Place Home Remodeling/);
  assert.match(html, /id="home-designer"/);
  const cat = await fetch(`${base}/js/catalog.js`);
  assert.equal(cat.status, 200);
  const js = await cat.text();
  assert.match(js, /Shower \/ Tub Style/);
  for (const f of ['/.env', '/server.js', '/config/emailConfig.js']) {
    assert.equal((await fetch(base + f)).status, 404, f);
  }
  for (const s of ['owner@caliber.test', 'secret']) assert.ok(!html.includes(s) && !js.includes(s));
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
});
