/**
 * Reusable page sections for designed inner pages.
 *
 * Page files in templates/pages/*.html use tags like
 *   {{getStarted title="Get Started Today"}}   {{gallery set="bath" count="16"}}
 * which render() replaces with the HTML below. Text/attributes are escaped.
 */
'use strict';

const LOCATIONS = require('../data/locations.json');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PHONE = '(208) 552-3037';
const TEL = 'tel:+12085523037';
const telOf = (p) => 'tel:+1' + String(p).replace(/\D/g, '').slice(-10);

const svg = (d, size = 18, extra = '') => `<svg class="ico" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
const I = {
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  dollar: '<path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.8 7 7s2.2 3.2 5 3.8 5 1.8 5 4.2-2.2 3.5-5 3.5-5-1.1-5-3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>'
};

function attrs(str) {
  const o = {};
  for (const m of String(str).matchAll(/(\w+)="([^"]*)"/g)) o[m[1]] = m[2];
  return o;
}

/** Big phone line used in heroes and CTA bands. */
const call = ({ label = 'Caliber Home Solutions', phone = PHONE }) => `
  <a class="pcall" href="${telOf(phone)}">
    <span class="pcall__icon">${svg(I.phone, 18)}</span>
    <span class="pcall__text">${label ? `<small>${esc(label)}</small>` : ''}<strong>${esc(phone)}</strong></span>
  </a>`;

/** Quick consultation card (filled by /js/home.js). */
const quickForm = () => '<div class="quick-card" data-quick-form-wrap></div>';

const getStarted = ({ title = 'Get Started Today', eyebrow = 'Get started today', text = 'Call today, our office is open Monday through Friday 8am to 5pm Mountain.', variant = 'teal' }) => `
  <section class="gs${variant === 'navy' ? ' gs--navy' : ''}" aria-label="${esc(title)}">
    <div class="gs__bg" aria-hidden="true"><img src="/images/pages/cta-bg.jpg" alt="" loading="lazy"></div>
    <div class="container gs__inner">
      <div class="gs__copy">
        ${eyebrow ? `<p class="eyebrow eyebrow--gold eyebrow--plain">${esc(eyebrow)}</p>` : ''}
        <h2 class="gs__title">${esc(title)}</h2>
        <p class="gs__text">${esc(text)}</p>
        ${call({ label: '' })}
      </div>
      ${quickForm()}
    </div>
  </section>`;

/** "Financing Available" style banner. variant: dark | cream */
const finBanner = ({ variant = 'dark', title = 'Financing Available', text = '', btn = PHONE, href = TEL, phoneBtn = 'yes' }) => `
  <div class="finb finb--${variant === 'cream' ? 'cream' : 'dark'}">
    <span class="finb__icon">${svg(I.dollar, 26)}</span>
    <div class="finb__copy"><h2 class="finb__title">${esc(title)}</h2><p>${esc(text)}</p></div>
    <a class="btn ${variant === 'cream' ? 'btn--blue' : 'btn--gold'} finb__btn" href="${esc(href)}"${href.startsWith('/') ? ' target="_blank" rel="noopener" data-open-form' : ''}>${phoneBtn === 'yes' ? svg(I.phone, 14) : ''}${esc(btn)}${phoneBtn === 'yes' ? '' : ` ${svg(I.arrow, 14)}`}</a>
  </div>`;

/* ---------- inspiration gallery (masonry; swaps to a carousel on mobile) ---------- */
const GALLERY = {
  bath: [1, 8, 6, 11, 12, 4, 2, 9, 10, 6, 1, 4, 12, 8, 11, 2],
  mixed: [12, 9, 2, 1, 6, 4, 7, 10, 8, 11, 3, 5],
  lift: [3, 7, 5, 9, 10, 2, 3, 12, 5, 7, 6, 11, 1, 8, 3, 5]
};
const GSIZE = {1:[700,381],2:[700,654],3:[400,544],4:[700,433],5:[400,544],6:[700,438],7:[700,518],8:[700,518],9:[700,581],10:[700,525],11:[700,518],12:[700,518]};
const gallery = ({ set = 'bath', eyebrow = 'Real Caliber projects', title = 'Inspiration Gallery', aside = '' }) => `
  <section class="section pg-gallery" id="inspiration-gallery">
    <div class="container">
      ${aside ? `<div class="section-head section-head--split"><div><p class="eyebrow eyebrow--plain">${esc(eyebrow)}</p><h2 class="h2">${esc(title)}</h2></div><p class="section-head__aside">${esc(aside)}</p></div>` : `<div class="section-head section-head--center">
        <p class="eyebrow eyebrow--plain">${esc(eyebrow)}</p>
        <h2 class="h2">${esc(title)}</h2>
      </div>`}
      <div class="masonry" data-carousel>
        ${(GALLERY[set] || GALLERY.bath).map((n, i) => `<figure class="masonry__item"><div class="media"><img src="/images/pages/g${n}.jpg" width="${GSIZE[n][0]}" height="${GSIZE[n][1]}" alt="Caliber Home Solutions project photo ${i + 1}" loading="lazy"></div></figure>`).join('')}
      </div>
    </div>
  </section>`;

/* ---------- schematic map of the Mountain West with office pins ---------- */
const STATES = {
  WA: [[-124.7, 48.4], [-123.1, 49], [-117, 49], [-117, 46], [-119, 46], [-121, 45.6], [-124, 46.3]],
  OR: [[-124, 46.3], [-121, 45.6], [-119, 46], [-117, 46], [-116.5, 45.5], [-117, 44], [-117, 42], [-124.2, 42]],
  CA: [[-124.2, 42], [-120, 42], [-120, 39], [-114.6, 35], [-114.7, 32.7], [-117.1, 32.5], [-118.5, 34], [-120.6, 34.6], [-122.4, 37.2], [-123.8, 39.8]],
  NV: [[-120, 42], [-114, 42], [-114, 36.1], [-114.6, 35], [-120, 39]],
  ID: [[-117, 49], [-116, 49], [-116, 47.5], [-114.4, 45.6], [-113, 44.4], [-111, 44.5], [-111, 42], [-117, 42], [-117, 44], [-116.5, 45.5], [-117, 46]],
  MT: [[-116, 49], [-104, 49], [-104, 45], [-111, 45], [-111, 44.5], [-113, 44.4], [-114.4, 45.6], [-116, 47.5]],
  WY: [[-111, 45], [-104, 45], [-104, 41], [-111, 41]],
  UT: [[-114, 42], [-111, 42], [-111, 41], [-109, 41], [-109, 37], [-114, 37]],
  CO: [[-109, 41], [-102, 41], [-102, 37], [-109, 37]],
  AZ: [[-114, 37], [-109, 37], [-109, 31.3], [-111, 31.3], [-114.8, 32.5], [-114.6, 35], [-114, 36.1]],
  NM: [[-109, 37], [-103, 37], [-103, 32], [-106.6, 32], [-106.5, 31.8], [-108.2, 31.8], [-108.2, 31.3], [-109, 31.3]],
  ND: [[-104, 49], [-97.2, 49], [-96.6, 46], [-104, 46]],
  SD: [[-104, 46], [-96.6, 46], [-96.5, 42.5], [-98.5, 43], [-104, 43]],
  NE: [[-104, 43], [-98.5, 43], [-96.5, 42.5], [-95.3, 40], [-102, 40], [-102, 41], [-104, 41]],
  KS: [[-102, 40], [-95.3, 40], [-94.6, 37], [-102, 37]],
  OK: [[-103, 37], [-94.6, 37], [-94.4, 33.6], [-100, 34.5], [-100, 36.5], [-103, 36.5]],
  TX: [[-103, 36.5], [-100, 36.5], [-100, 34.5], [-94.4, 33.6], [-94, 29.7], [-97.4, 26], [-99.5, 27.5], [-101.4, 29.8], [-104.5, 29.6], [-106.5, 31.8], [-103, 32]]
};
const LABELS = { WA: [-120.6, 47.4], OR: [-120.6, 43.9], CA: [-119.8, 37.3], NV: [-116.9, 39.4], ID: [-114.6, 43.4], MT: [-109.6, 47], WY: [-107.5, 43], UT: [-111.6, 38.6], CO: [-105.5, 39], AZ: [-111.7, 34.2], NM: [-106.1, 34.4], ND: [-100.4, 47.5], SD: [-100.3, 44.4], NE: [-99.6, 41.5], KS: [-98.4, 38.5], OK: [-97.5, 35.5], TX: [-99.5, 31.4] };
const COAST = [[-126, 50], [-124.7, 48.4], [-124, 46.3], [-124.2, 42], [-123.8, 39.8], [-122.4, 37.2], [-120.6, 34.6], [-118.5, 34], [-117.1, 32.5], [-114.7, 31.5], [-112.2, 29], [-110.5, 25], [-126, 25]];

function map({ mode = 'all' }) {
  const lon0 = -125.6; const lon1 = -95.5; const lat0 = 33.5; const lat1 = 49.6;
  const k = Math.cos((42 * Math.PI) / 180);
  const W = 1000; const s = W / ((lon1 - lon0) * k); const H = Math.round((lat1 - lat0) * s);
  const P = ([lon, lat]) => [((lon - lon0) * k * s).toFixed(1), ((lat1 - lat) * s).toFixed(1)];
  const poly = (pts) => pts.map((p) => P(p).join(',')).join(' ');
  const pins = (mode === 'hq' ? LOCATIONS.filter((l) => l.hq) : LOCATIONS).map((l) => {
    const [x, y] = P([l.lon, l.lat]);
    return `<a href="${esc(l.href)}" class="map__pin${l.hq ? ' map__pin--hq' : ''}" aria-label="${esc(`${l.city}, ${l.st} – ${l.label}`)}">
      <g transform="translate(${x} ${y})${mode === 'hq' ? ' scale(2.2)' : ''}"><title>${esc(`${l.city}, ${l.st}`)}</title><polygon points="0,-30 13,0 0,-8 -13,0" class="map__arrow"/></g></a>`;
  }).join('');
  return `<svg class="map" viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of Caliber Home Solutions offices across the Mountain West" preserveAspectRatio="xMidYMid slice">
    <rect width="${W}" height="${H}" class="map__land"/>
    <polygon points="${poly(COAST)}" class="map__sea"/>
    ${Object.entries(STATES).map(([st, pts]) => `<polygon points="${poly(pts)}" class="map__state${['ID', 'MT', 'UT', 'NV', 'OR', 'WY', 'WA'].includes(st) ? ' map__state--served' : ''}"/>`).join('')}
    ${Object.entries(LABELS).map(([st, ll]) => { const [x, y] = P(ll); return `<text x="${x}" y="${y}" class="map__label">${st}</text>`; }).join('')}
    ${pins}
  </svg>`;
}

const locationCards = () => `
  <ol class="locs" data-carousel>
    ${LOCATIONS.map((l) => `
    <li class="loc${l.hq ? ' loc--hq' : ''}">
      <h3 class="loc__title"><span class="loc__n">${l.n}</span><a href="${esc(l.href)}">${esc(l.city)}, ${esc(l.st)}</a></h3>
      <p class="loc__label">${esc(l.label)}</p>
      <p class="loc__addr">${svg(I.pin, 14)}<span>${esc(l.street)}<br>${esc(l.locality)}</span></p>
      <a class="loc__phone" href="${telOf(l.phone)}">${svg(I.phone, 14)}${esc(l.phone)}</a>
      <a class="loc__more" href="${esc(l.href)}">View location ${svg(I.arrow, 12)}</a>
    </li>`).join('')}
  </ol>`;

const REVIEWS = [
  ['Eric S.', '“Caliber Home Solutions did a great job installing my Stiltz Home Lift Trio System. The finishing work had great detail and their contract price was honored!”'],
  ['Mitzi Beller', 'I love my new Walk-in Shower. It is beautiful. The installer knew what he was doing and he finished the job quickly. The shower is worth the price and I no longer fear falling in the bathtub.'],
  ['Cynthia Higley', 'The Walk-in Showers are amazing; the surface is so easy to clean and beautiful. The customer service is informative and will go the extra mile to ensure you are satisfied.'],
  ['Gary Fuhriman', 'Happy with every thing.'],
  ['Barb Clarke', 'Great experience with purchase & install of Stiltz Trio home lift!'],
  ['Stormie Grogan', 'Caliber has been a great company to work with. Very responsive and offer a great quality product with service after the sale.']
];
const GOOGLE_G = '<svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';
const reviews = ({ eyebrow = 'Our reviews', title = 'What our customers are saying' }) => `
  <section class="section">
    <div class="container">
      <div class="section-head section-head--split">
        <div><p class="eyebrow">${esc(eyebrow)}</p><h2 class="h2">${esc(title)}</h2></div>
        <div class="google-badge"><span class="google-badge__logo">${GOOGLE_G}</span><div><span class="stars" aria-label="5 out of 5 stars">★★★★★</span><strong>5-star Google reviews</strong><a href="https://www.google.com/search?q=Caliber+Home+Solutions+reviews" target="_blank" rel="noopener">Read them on Google →</a></div></div>
      </div>
      <div class="reviews reviews--real" data-carousel>
        ${REVIEWS.map(([name, text]) => `
        <figure class="card review review--top">
          <figcaption><span class="review__avatar" aria-hidden="true">${esc(name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2))}</span><span><strong>${esc(name)}</strong><span class="stars" aria-label="5 out of 5 stars">★★★★★</span></span></figcaption>
          <blockquote>${esc(text)}</blockquote>
        </figure>`).join('')}
      </div>
    </div>
  </section>`;

/* Brand marks (styled text placeholders – swap for official logo files) */
const LOGO = {
  jacuzzi: '<span class="blogo blogo--jacuzzi"><b>Jacuzzi</b><i></i><span>Bath Remodel</span></span>',
  jacuzziStack: '<span class="blogo blogo--jstack"><b>Jacuzzi</b><span>Bath Remodel</span></span>',
  stiltz: '<span class="blogo blogo--stiltz"><b>Stiltz</b><span>Homelifts</span></span>',
  pollock: '<span class="blogo blogo--pollock"><b>pollock</b><small>Residential<br>Elevators Inc.</small></span>',
  bruno: '<span class="blogo blogo--bruno"><svg viewBox="0 0 30 24" width="30" height="24" aria-hidden="true"><path d="M2 20 C10 16 16 10 28 2 C22 10 18 15 14 22 L12 14 Z" fill="#2aa44a"/><path d="M13 13 L22 6 L15 16 Z" fill="#1c5fa8"/></svg><b>BRUNO</b></span>'
};
const logo = ({ name }) => LOGO[name] || '';
const brands = () => `
  <div class="brands">
    <div class="brands__group"><h2 class="brands__title">Our Bathroom Remodeling Brands</h2><div class="brands__row"><div class="brands__logo">${LOGO.jacuzzi}</div></div></div>
    <div class="brands__group"><h2 class="brands__title">Our Home Lift Brands</h2><div class="brands__row brands__row--2"><div class="brands__logo">${LOGO.stiltz}</div><div class="brands__logo">${LOGO.bruno}</div></div></div>
  </div>`;

const icon = ({ name, size = '18' }) => svg(I[name] || '', Number(size));

/** Full-width gold financing band with a big number (or a short headline only). */
const goldBand = ({ big = '', eyebrow = 'Financing available', title, btn = 'Explore Financing Plans', href = '/financing/' }) => `
  <section class="gband">
    <div class="container gband__inner">
      ${big ? `<span class="gband__big">${esc(big)}</span>` : ''}
      <div class="gband__copy"><p class="gband__eyebrow">${esc(eyebrow)}</p><h2 class="gband__title">${esc(title)}</h2></div>
      <a class="btn btn--blue gband__btn" href="${esc(href)}">${esc(btn)} ${svg(I.arrow, 14)}</a>
    </div>
  </section>`;

/** "Authorized dealer: Jacuzzi" strip. */
const dealer = ({ label = 'Authorized dealer:', text = '' }) => `
  <div class="dealer${text ? ' dealer--text' : ''}">
    ${text ? `<span class="dealer__logo">${LOGO.jacuzziStack}</span><div><p class="eyebrow eyebrow--plain">Authorized dealer</p><p class="dealer__text">${esc(text)}</p></div>`
    : `<span class="dealer__label">${esc(label)}</span><span class="dealer__logo">${LOGO.jacuzziStack}</span>`}
  </div>`;

/** Jacuzzi badge used in bathroom heroes. */
const heroDealer = () => `<span class="hdealer"><span class="hdealer__logo">${LOGO.jacuzziStack}</span><span class="hdealer__text">Authorized Dealer</span></span>`;

const HELPERS = { call, quickForm, getStarted, finBanner, gallery, map, locationCards, reviews, brands, logo, icon, goldBand, dealer, heroDealer };

function render(html, ctx = {}) {
  return html.replace(/\{\{(\w+)([^}]*)\}\}/g, (m, name, rest) => {
    if (name === 'crumbs') return ctx.crumbs || '';
    if (name === 'h1') return ctx.h1 || '';
    const fn = HELPERS[name];
    return fn ? fn(attrs(rest)) : m;
  });
}

module.exports = { render, REVIEWS, LOCATIONS };
