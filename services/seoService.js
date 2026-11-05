/**
 * Server-rendered pages + SEO.
 *
 * Every URL in data/pages.json (from the client's sitemap/metadata document) is
 * served with its own <title>, meta description, canonical URL, Open Graph /
 * Twitter tags, robots directive and JSON-LD.
 *
 *  - "/" , "/design-tool/" and "/contact-us/" render the full app (public/index.html)
 *    with the matching view visible in the HTML.
 *  - All other pages render templates/page.html: the shared header + footer and a
 *    blank content area, waiting for their designs. They are noindex until
 *    `ready: true` is set for them in data/pages.json.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = require('../data/pages.json');
const BY_PATH = new Map(PAGES.map((p) => [p.path, p]));
const APP_PATHS = { '/': 'landing', '/design-tool/': 'builder' };
const parts = require('./pageParts');
// Views each URL carries. The design tool keeps its board + form step, exactly as before.
const KEEP_VIEWS = { landing: ['landing'], builder: ['builder', 'summary'], summary: ['summary'] };

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

function siteUrl() {
  return (process.env.SITE_URL || 'https://caliberhsolutions.com').replace(/\/+$/, '');
}

/** Only the production host may be indexed; previews (tunnels, Render, localhost) are always noindex. */
function isProductionHost(req) {
  try { return new URL(siteUrl()).hostname === req.hostname; } catch (_) { return false; }
}

let cache = null;
function templates() {
  if (cache && process.env.NODE_ENV === 'production') return cache;
  const app = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
  const cut = (a, b) => app.slice(app.indexOf(a), app.indexOf(b) + b.length);
  cache = {
    app,
    header: cut('<!--HEADER-START-->', '<!--HEADER-END-->'),
    footer: cut('<!--FOOTER-START-->', '<!--FOOTER-END-->'),
    page: fs.readFileSync(path.join(ROOT, 'templates', 'page.html'), 'utf8'),
    designed: {}
  };
  // Designed page bodies: templates/pages/<template>.html (see data/pages.json "template")
  for (const p of PAGES.filter((x) => x.template)) {
    cache.designed[p.path] = fs.readFileSync(path.join(ROOT, 'templates', 'pages', `${p.template}.html`), 'utf8');
  }
  return cache;
}

function breadcrumbs(page) {
  const trail = [];
  for (let p = page; p; p = p.parent ? BY_PATH.get(p.parent) : null) trail.unshift(p);
  if (page.path !== '/') trail.unshift(BY_PATH.get('/'));
  return trail;
}

const ORG = () => ({
  '@type': 'HomeAndConstructionBusiness',
  '@id': `${siteUrl()}/#business`,
  name: 'Caliber Home Solutions',
  url: `${siteUrl()}/`,
  logo: `${siteUrl()}/images/brand/caliber-logo.png`,
  image: `${siteUrl()}/images/home/hero-banner.jpg`,
  telephone: '+1-208-552-3037',
  address: { '@type': 'PostalAddress', streetAddress: '6025 South Yellowstone Highway', addressLocality: 'Idaho Falls', addressRegion: 'ID', postalCode: '83402', addressCountry: 'US' },
  areaServed: ['Idaho', 'Montana', 'Utah', 'Wyoming', 'Nevada', 'Oregon', 'Washington'],
  foundingDate: '1999',
  openingHours: 'Mo-Fr 08:00-17:00'
});

function structuredData(page) {
  const url = siteUrl() + page.path;
  const graph = [{ '@type': 'WebPage', '@id': `${url}#webpage`, url, name: page.title, description: page.description, isPartOf: { '@id': `${siteUrl()}/#website` }, about: { '@id': `${siteUrl()}/#business` } }];
  if (page.path === '/') {
    graph.push(ORG(), { '@type': 'WebSite', '@id': `${siteUrl()}/#website`, url: `${siteUrl()}/`, name: 'Caliber Home Solutions' });
  }
  if (page.path === '/design-tool/') {
    graph.push({
      '@type': 'WebApplication', name: 'Caliber Bath Designer', url, applicationCategory: 'DesignApplication', operatingSystem: 'Any',
      description: page.description, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, provider: { '@id': `${siteUrl()}/#business` }
    });
  }
  if (page.path === '/contact-us/') {
    graph.push({ '@type': 'ContactPage', url, name: page.title, about: { '@id': `${siteUrl()}/#business` } });
  }
  if (page.path === '/locations/') {
    parts.LOCATIONS.forEach((l) => graph.push({
      '@type': 'HomeAndConstructionBusiness', name: `Caliber Home Solutions – ${l.city}, ${l.st}`, parentOrganization: { '@id': `${siteUrl()}/#business` },
      telephone: l.phone, url: siteUrl() + l.href,
      address: { '@type': 'PostalAddress', streetAddress: l.street, addressLocality: l.city, addressRegion: l.st, addressCountry: 'US' },
      geo: { '@type': 'GeoCoordinates', latitude: l.lat, longitude: l.lon }
    }));
  }
  const crumbs = breadcrumbs(page);
  if (crumbs.length > 1) {
    graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.crumb, item: siteUrl() + c.path })) });
  }
  return jsonLd({ '@context': 'https://schema.org', '@graph': graph });
}

function headTags(page, req) {
  const url = siteUrl() + page.path;
  const index = page.ready && isProductionHost(req);
  const img = `${siteUrl()}/images/home/hero-banner.jpg`;
  return [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta name="robots" content="${index ? 'index, follow, max-image-preview:large' : 'noindex, follow'}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Caliber Home Solutions">',
    '<meta property="og:locale" content="en_US">',
    `<meta property="og:title" content="${esc(page.title)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(img)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(page.title)}">`,
    `<meta name="twitter:description" content="${esc(page.description)}">`,
    `<meta name="twitter:image" content="${esc(img)}">`,
    '<meta name="theme-color" content="#0A2540">',
    structuredData(page)
  ].join('\n  ');
}

/** Static, crawlable intro for the design tool (JS replaces it with the interactive picker). */
const DESIGN_TOOL_SSR = (page) => `
          <div class="styles">
            <h1 class="styles__title">${esc(page.h1)}</h1>
            <p class="styles__sub">Plan your accessible bathroom in about two minutes: choose a shower or tub style, wall pattern and colour, flooring, vanity, countertop, shower door, fixtures, mirror and safety accessories, then send your design to a local Caliber consultant for a free quote.</p>
            <p><a class="btn btn--blue" href="/design-tool/#/builder/step-1">Start designing</a></p>
          </div>`;

function renderApp(page, req) {
  const { app } = templates();
  const view = APP_PATHS[page.path];
  let html = app.replace('<!--SEO-->', headTags(page, req));
  // Show the right view in the server HTML (no flash, crawlers see the real content).
  html = html.replace(new RegExp(`(data-view="${view}")\\s+hidden`), '$1');
  // Each URL only carries its own view: no duplicate content and exactly one <h1> per page.
  const VIEWS = { landing: 'VIEW: HOMEPAGE', builder: 'VIEW: BUILDER', summary: 'VIEW: SUMMARY' };
  for (const [name, marker] of Object.entries(VIEWS)) {
    if (KEEP_VIEWS[view].includes(name)) continue;
    html = html.replace(new RegExp(`\\s*<!-- =+ ${marker}[\\s\\S]*?(?=\\s*<!-- =+ VIEW:|\\s*</div>\\s*<div class="toast")`), '');
  }
  if (view === 'builder') {
    // The board step's heading stays an <h2> here so the page has a single <h1> (same look: styled by class).
    html = html.replace('<h1 class="summary__title" id="summary-title">Your Vision Board is Ready!</h1>', '<h2 class="summary__title" id="summary-title">Your Vision Board is Ready!</h2>');
    html = html.replace('<div class="builder__content" id="builder-content" aria-live="polite"></div>', `<div class="builder__content" id="builder-content" aria-live="polite">${DESIGN_TOOL_SSR(page)}</div>`);
  }
  return html;
}

function childLinks(page) {
  const kids = PAGES.filter((p) => p.parent === page.path);
  if (!kids.length) return '';
  return `<ul class="page-links">${kids.map((k) => `<li><a href="${esc(k.path)}">${esc(k.type === 'location' ? k.city : k.h1)}</a></li>`).join('')}</ul>`;
}

function renderPage(page, req) {
  const t = templates();
  const crumbs = breadcrumbs(page);
  if (t.designed[page.path]) {
    const crumbLight = `<nav class="crumbs crumbs--slash" aria-label="Breadcrumb"><ol>${crumbs.map((c, i) => (i === crumbs.length - 1
      ? `<li aria-current="page">${esc(c.crumb)}</li>`
      : `<li><a href="${esc(c.path)}">${esc(c.crumb)}</a></li>`)).join('')}</ol></nav>`;
    const body = parts.render(t.designed[page.path], { crumbs: crumbLight });
    return t.page
      .replace('<!--SEO-->', headTags(page, req))
      .replace('<!--HEADER-->', t.header)
      .replace('<!--FOOTER-->', t.footer)
      .replace(/<main id="content" class="page-blank"[\s\S]*?<\/main>/, () => `<main id="content" class="page-designed">${body}\n  </main>`);
  }
  const crumbHtml = `<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs.map((c, i) => (i === crumbs.length - 1
    ? `<li aria-current="page">${esc(c.crumb)}</li>`
    : `<li><a href="${esc(c.path)}">${esc(c.crumb)}</a></li>`)).join('')}</ol></nav>`;
  return t.page
    .replace('<!--SEO-->', headTags(page, req))
    .replace('<!--HEADER-->', t.header)
    .replace('<!--FOOTER-->', t.footer)
    .replace('<!--BREADCRUMBS-->', crumbHtml)
    .replace('<!--H1-->', esc(page.h1))
    .replace('<!--INTRO-->', esc(page.description))
    .replace('<!--CHILDREN-->', childLinks(page))
    .replace('<!--PATH-->', esc(page.path));
}

/** Express middleware: renders any page from the registry; 301s missing trailing slashes. */
function pagesMiddleware(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  let p = req.path;
  if (!p.endsWith('/') && BY_PATH.has(p + '/')) {
    const q = req.originalUrl.slice(req.path.length);
    return res.redirect(301, p + '/' + q);
  }
  if (p === '/index.html') return res.redirect(301, '/');
  const page = BY_PATH.get(p);
  if (!page) return next();
  res.set('Cache-Control', 'no-cache');
  res.type('html').send(APP_PATHS[page.path] ? renderApp(page, req) : renderPage(page, req));
}

function sitemap(req, res) {
  // Only finished (indexable) pages belong in the sitemap; placeholders join once `ready: true`.
  const indexed = PAGES.filter((p) => p.ready);
  const body = indexed.map((p) => `  <url><loc>${esc(siteUrl() + p.path)}</loc></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
}

function robots(req, res) {
  res.type('text/plain').send(isProductionHost(req)
    ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteUrl()}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n');
}

module.exports = { pagesMiddleware, sitemap, robots, PAGES, siteUrl };
