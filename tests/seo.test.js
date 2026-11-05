/**
 * SEO tests: every page from the client's metadata document is served at its
 * exact URL with the exact title/description, a canonical, one <h1>, and the
 * right robots directive. Also covers redirects, sitemap and robots.txt.
 */
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.SITE_URL = 'https://caliberhsolutions.com';
process.env.DISABLE_FILE_LOGS = 'true';

const { createApp } = require('../server');
const PAGES = require('../data/pages.json');

let http; let base;
before(async () => {
  http = createApp().listen(0, '127.0.0.1');
  await new Promise((r) => http.once('listening', r));
  base = `http://127.0.0.1:${http.address().port}`;
});
after(() => new Promise((r) => http.close(r)));

const nodeHttp = require('node:http');
const PROD = { host: 'caliberhsolutions.com' };
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
/** Minimal GET (fetch() drops a custom Host header). Returns a fetch-like response. */
const get = (u, o = {}) => new Promise((resolve, reject) => {
  const url = new URL(base + u);
  nodeHttp.get({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers: o.host ? { Host: o.host } : {} }, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (c) => { body += c; });
    res.on('end', () => resolve({ status: res.statusCode, headers: { get: (k) => res.headers[k.toLowerCase()] }, text: async () => body }));
  }).on('error', reject);
});

test('registry covers every sitemap URL (56 from the doc + Washington)', () => {
  assert.equal(PAGES.length, 57);
  assert.equal(new Set(PAGES.map((p) => p.path)).size, 57);
  for (const p of PAGES) assert.match(p.path, /^\/([a-z0-9-]+\/)*$/);
});

test('every page: 200, exact title + description, canonical, single h1', async () => {
  for (const p of PAGES) {
    const res = await get(p.path, PROD);
    assert.equal(res.status, 200, p.path);
    const html = await res.text();
    assert.equal(decode(html.match(/<title>([^<]*)<\/title>/)[1]), p.title, `${p.path} title`);
    assert.equal(decode(html.match(/<meta name="description" content="([^"]*)"/)[1]), p.description, `${p.path} description`);
    assert.ok(html.includes(`<link rel="canonical" href="https://caliberhsolutions.com${p.path}">`), `${p.path} canonical`);
    assert.ok(html.includes(`<meta property="og:title" content="`), `${p.path} og`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${p.path} exactly one h1`);
    const robots = html.match(/<meta name="robots" content="([^"]*)"/)[1];
    assert.equal(robots.startsWith('index'), p.ready, `${p.path} robots=${robots}`);
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.ok(ld['@graph'].length >= 1, `${p.path} json-ld`);
  }
});

test('header and footer links follow the navigation document', async () => {
  const html = await (await get('/services/walk-in-tubs/', PROD)).text();
  for (const href of ['/service/bathroom-remodeling/', '/services/walk-in-tubs/', '/services/walk-in-showers/', '/service/lifts/',
    '/services/stairlifts/', '/services/elevator-lifts/', '/design-tool/', '/offers/', '/financing/', '/locations/', '/contact-us/',
    '/careers/', '/blog/', '/privacy-policy/', '/terms-and-conditions/', '/offer-terms/']) {
    assert.ok(html.includes(`href="${href}"`), href);
  }
});

test('internal links only point at real pages', async () => {
  const known = new Set(PAGES.map((p) => p.path));
  for (const u of ['/', '/locations/', '/locations/boise-id/', '/service/lifts/', '/service/bathroom-remodeling/', '/services/walk-in-showers/']) {
    const html = await (await get(u, PROD)).text();
    for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
      if (/\.(css|svg|png|jpg|js)$/.test(href) || href.startsWith('/images/')) continue;
      assert.ok(known.has(href), `${u} links to unknown ${href}`);
    }
  }
});

test('design tool page is server-rendered and crawlable', async () => {
  const html = await (await get('/design-tool/', PROD)).text();
  assert.match(html, /<h1 class="styles__title">Walk-In Shower &amp; Bathroom Design Tool<\/h1>/);
  assert.match(html, /"@type":"WebApplication"/);
  assert.ok(!html.includes('id="view-landing"'), 'no duplicate homepage markup');
  assert.match(html, /data-view="builder">/);
});

test('designed pages render their sections, carousels and quick forms', async () => {
  const expect = {
    '/offers/': ['Sweepstakes / Giveaway', 'Requesting Rules or a Winners List', 'Refer a Friend', 'Get Started Today'],
    '/financing/': ['Jacuzzi Bath Remodel Showers', '$2,500', 'It’s easy to get a custom shower', 'Inspiration Gallery'],
    '/contact-us/': ['Our Corporate Office', 'Our Home Lift Brands', 'About Us', 'Stormie Grogan', 'Call Today'],
    '/locations/': ['Our Locations', 'Evansville, WY', 'Walk In Bath Upgrade Options', 'Home Lift Upgrade Options'],
    '/services/elevator-lifts/': ['Elevate Your Home with Stiltz Elevators', 'Why Choose Caliber', 'Home Elevator Lifts for Everyone', 'Learn More Today'],
    '/services/stairlifts/': ['Premium Stair Lifts', 'Bruno Stair Lifts', 'Residential Platform Lifts', 'Inspiration Gallery'],
    '/service/lifts/': ['Home Lift Systems Expertly Installed', 'Stair Lifts', 'Home Elevators', 'Learn more today about our financing options.'],
    '/services/walk-in-tubs/': ['01</em> Safety', 'Walk-in Tub Safety Features', 'Expert Installation', 'Get Started on your Walk in Tub Upgrade'],
    '/services/walk-in-showers/': ['Tub-To-Shower Conversion', '3 Easy Steps to a New Shower', 'Advantages of Jacuzzi Bath Remodel Showers', 'Walk-in Showers Installed in Just One Day'],
    '/service/bathroom-remodeling/': ['Bathroom Remodeling Services', 'Comfortable Bathroom Remodeling for Every Home', 'Most Bathroom Upgrades are available at 12 Months Zero Interest', 'Start Your Bathroom Remodel']
  };
  for (const [u, texts] of Object.entries(expect)) {
    const html = (await (await get(u, PROD)).text()).replace(/&amp;/g, '&');
    assert.ok(!html.includes('{{'), `${u} unresolved tag`);
    assert.ok(html.includes('data-quick-form-wrap'), `${u} quick form`);
    for (const t of texts) assert.ok(html.includes(t), `${u} missing "${t}"`);
  }
  const loc = await (await get('/locations/', PROD)).text();
  assert.equal((loc.match(/class="loc[ "]/g) || []).length, 12, '12 office cards');
});

test('missing trailing slash -> 301; unknown -> 404', async () => {
  const r = await get('/services/stairlifts');
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), '/services/stairlifts/');
  assert.equal((await get('/index.html')).status, 301);
  assert.equal((await get('/not-a-page/')).status, 404);
});

test('sitemap is the supplied file; every URL loads; robots allows only on production host', async () => {
  const res = await get('/sitemap.xml', PROD);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /xml/);
  const sm = await res.text();
  const expected = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'sitemap.xml'), 'utf8');
  assert.equal(sm, expected, 'serves the supplied sitemap file unchanged');
  const locs = [...sm.matchAll(/<loc>https:\/\/caliberhsolutions\.com([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locs.length, 57);
  for (const l of locs) assert.equal((await get(l, PROD)).status, 200, `sitemap URL ${l} must load`);
  assert.match(await (await get('/robots.txt', PROD)).text(), /Allow: \/[\s\S]*Sitemap: https:\/\/caliberhsolutions\.com\/sitemap\.xml/);
  assert.match(await (await get('/robots.txt')).text(), /Disallow: \/\n/);
  const preview = await (await get('/')).text();
  assert.match(preview, /<meta name="robots" content="noindex, follow">/, 'preview hosts are never indexed');
});
