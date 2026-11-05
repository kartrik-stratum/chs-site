/**
 * CTA links per "Caliber Home Solutions – All Pages CTA Link Mapping".
 * For each page: every listed destination must be linked from that page.
 */
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const nodeHttp = require('node:http');

process.env.NODE_ENV = 'test';
process.env.DISABLE_FILE_LOGS = 'true';
const { createApp } = require('../server');

let http; let port;
before(async () => { http = createApp().listen(0, '127.0.0.1'); await new Promise((r) => http.once('listening', r)); port = http.address().port; });
after(() => new Promise((r) => http.close(r)));

const get = (path) => new Promise((resolve, reject) => {
  nodeHttp.get({ hostname: '127.0.0.1', port, path }, (res) => { let b = ''; res.setEncoding('utf8'); res.on('data', (c) => { b += c; }); res.on('end', () => resolve(b)); }).on('error', reject);
});
const TEL = 'tel:+12085523037';
const C = '/contact-us/';

const MAP = {
  '/': [C, '/services/walk-in-showers/', '/services/walk-in-tubs/', '/services/stairlifts/', '/services/elevator-lifts/', '/design-tool/', '/offers/', '/financing/', '/locations/', TEL],
  '/service/bathroom-remodeling/': ['/services/walk-in-showers/', '/services/walk-in-tubs/', C, TEL, '/offers/', 'id="inspiration-gallery"'],
  '/services/walk-in-showers/': [C, '/service/bathroom-remodeling/', '/financing/', TEL, 'id="inspiration-gallery"'],
  '/services/walk-in-tubs/': [C, '/financing/', TEL, 'id="inspiration-gallery"'],
  '/service/lifts/': ['/services/stairlifts/', '/services/elevator-lifts/', C, '/financing/', TEL, 'id="inspiration-gallery"'],
  '/services/stairlifts/': [C, TEL, 'id="inspiration-gallery"'],
  '/services/elevator-lifts/': [C, '/financing/', TEL, 'id="inspiration-gallery"'],
  '/contact-us/': [TEL, '/locations/', 'data-quick-form-wrap'],
  '/financing/': ['#financing-offers', 'id="financing-offers"', C, TEL, '/offers/'],
  '/offers/': ['id="current-promotions"', C, '/financing/', '/offer-terms/', TEL],
  '/about-us/': [C, TEL, '/locations/'],
  '/locations/': ['/locations/idaho-falls-id/', '/locations/las-vegas/', '/locations/bozeman-mt/', '/locations/salt-lake-city-ut/', '/locations/ogden-ut/', '/locations/boise-id/', '/locations/nampa-id/', '/locations/bend-or/', '/locations/billings-mt/', '/locations/stevensville-mt/', '/locations/santaquin/', '/locations/evansville/', C, TEL],
  '/service-area/': ['/locations/', C],
  '/pricing/': [C, TEL],
  '/design-tool/': [C],
  '/blog/': [C]
};
const FOOTER = ['/service/bathroom-remodeling/', '/service/lifts/', '/design-tool/', '/offers/', '/locations/', '/financing/', '/careers/', '/blog/', '/services/walk-in-tubs/', '/services/walk-in-showers/', '/services/stairlifts/', '/services/elevator-lifts/', '/privacy-policy/', '/terms-and-conditions/', '/offer-terms/'];

for (const [page, targets] of Object.entries(MAP)) {
  test(`CTAs on ${page}`, async () => {
    const html = await get(page);
    for (const t of targets) {
      const ok = t.startsWith('id=') || t === 'data-quick-form-wrap' ? html.includes(t) : html.includes(`href="${t}"`);
      assert.ok(ok, `${page} is missing ${t}`);
    }
    if (page !== '/design-tool/') for (const f of FOOTER) assert.ok(html.includes(`href="${f}"`), `${page} footer missing ${f}`);
    assert.ok(!/href="\/#\//.test(html), `${page} still has an old /#/ hash link`);
  });
}

test('every "Free Consultation" style button points at /contact-us/', async () => {
  for (const page of Object.keys(MAP)) {
    const html = await get(page);
    for (const m of html.matchAll(/<a [^>]*href="([^"]+)"[^>]*>(?:(?!<\/a>).)*?(Free Consultation|Book a Free Consultation|Claim This Offer|Get a Free Quote|Request a Free Consultation)/gs)) {
      assert.equal(m[1], C, `${page}: "${m[2]}" -> ${m[1]}`);
    }
  }
});
