'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const nodeHttp = require('node:http');
process.env.NODE_ENV = 'test'; process.env.DISABLE_FILE_LOGS = 'true';
const { createApp } = require('../server');
const POSTS = require('../data/posts.json');

let http; let port;
before(async () => { http = createApp().listen(0, '127.0.0.1'); await new Promise((r) => http.once('listening', r)); port = http.address().port; });
after(() => new Promise((r) => http.close(r)));
const get = (path) => new Promise((resolve, reject) => {
  nodeHttp.get({ hostname: '127.0.0.1', port, path, headers: { Host: 'caliberhsolutions.com' } }, (res) => { let b = ''; res.setEncoding('utf8'); res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: b })); }).on('error', reject);
});

test('blog listing shows every article with its date and link', async () => {
  const { status, body } = await get('/blog/');
  assert.equal(status, 200);
  assert.match(body, /Aging in Place Articles/);
  for (const p of POSTS) {
    assert.ok(body.includes(`href="/blog/${p.slug}/"`), `link to ${p.slug}`);
    assert.ok(body.includes(`datetime="${p.date}"`), `date for ${p.slug}`);
  }
  assert.ok(!body.includes('{{'));
});

test('every article has its own SEO page', async () => {
  for (const p of POSTS) {
    const { status, body } = await get(`/blog/${p.slug}/`);
    assert.equal(status, 200, p.slug);
    assert.equal((body.match(/<h1[\s>]/g) || []).length, 1);
    assert.ok(body.includes(`<link rel="canonical" href="https://caliberhsolutions.com/blog/${p.slug}/">`));
    assert.match(body, /"@type":"BlogPosting"/);
    assert.match(body, /<meta name="robots" content="index/);
    assert.ok(!body.includes('{{'));
  }
});

test('blog redirects and 404s', async () => {
  const r = await get(`/blog/${POSTS[1].slug}`);
  assert.equal(r.status, 301);
  assert.equal(r.headers.location, `/blog/${POSTS[1].slug}/`);
  assert.equal((await get('/blog/not-a-post/')).status, 404);
});
