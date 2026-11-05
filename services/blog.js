/**
 * Blog: listing (/blog/, /blog/page/N/) and single posts (/blog/<slug>/),
 * all driven by data/posts.json (newest first). To add an article, add an
 * entry there; it appears on the blog and gets its own page automatically.
 */
'use strict';

const POSTS = require('../data/posts.json').slice().sort((a, b) => (a.date < b.date ? 1 : -1));
const PER_PAGE = 9;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arrow = '<svg class="ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const cal = '<svg class="ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';

const url = (p) => `/blog/${p.slug}/`;
const fmtDate = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const words = (p) => p.body.map(([, t]) => t).join(' ').split(/\s+/).length;
const readMins = (p) => Math.max(2, Math.round(words(p) / 200));
const featured = () => POSTS.find((p) => p.featured) || POSTS[0];
const listed = () => POSTS.filter((p) => p !== featured());
const pageCount = () => Math.max(1, Math.ceil(listed().length / PER_PAGE));
const findPost = (slug) => POSTS.find((p) => p.slug === slug);
const number = (p) => String(POSTS.indexOf(p) + 1).padStart(2, '0');

function featuredHtml() {
  const p = featured();
  return `
  <article class="bfeat">
    <a class="bfeat__media media" href="${url(p)}" tabindex="-1" aria-hidden="true"><img src="${esc(p.image)}" alt="" fetchpriority="high"></a>
    <div class="bfeat__body">
      <div class="bfeat__left">
        <span class="tag tag--gold">${esc(p.category)}</span>
        <h2 class="bfeat__title"><a href="${url(p)}">${esc(p.title)}</a></h2>
        <p class="bdate">${cal}<time datetime="${p.date}">${fmtDate(p.date)}</time></p>
      </div>
      <div class="bfeat__right">
        <p>${esc(p.excerpt)}</p>
        <a class="btn btn--gold btn--sm" href="${url(p)}">Read More ${arrow}</a>
      </div>
    </div>
  </article>`;
}

function card(p) {
  return `
    <article class="bcard">
      <a class="bcard__media media" href="${url(p)}" tabindex="-1" aria-hidden="true"><img src="${esc(p.image)}" alt="" loading="lazy"></a>
      <div class="bcard__body">
        <p class="bcard__meta"><span class="tag tag--teal">Article ${number(p)}</span><span class="bdate">${cal}<time datetime="${p.date}">${fmtDate(p.date)}</time></span></p>
        <h3 class="bcard__title"><a href="${url(p)}">${esc(p.title)}</a></h3>
        <p class="bcard__text">${esc(p.excerpt)}</p>
        <a class="bcard__more" href="${url(p)}">Read More ${arrow}<span class="sr-only"> about ${esc(p.title)}</span></a>
      </div>
    </article>`;
}

function pager(n) {
  const total = pageCount();
  if (total < 2) return '';
  const href = (i) => (i === 1 ? '/blog/' : `/blog/page/${i}/`);
  const nums = Array.from({ length: total }, (_, i) => i + 1).map((i) => (i === n
    ? `<span class="bpager__num is-current" aria-current="page">${i}</span>`
    : `<a class="bpager__num" href="${href(i)}">${i}</a>`)).join('');
  return `<nav class="bpager" aria-label="Posts navigation"><span class="bpager__label">Posts navigation</span><div class="bpager__nums">${nums}</div>
    ${n < total ? `<a class="bpager__older" href="${href(n + 1)}">Older posts ${arrow}</a>` : `<a class="bpager__older" href="${href(n - 1)}">Newer posts ${arrow}</a>`}</nav>`;
}

/** Listing body for page n (1-based). */
function listHtml(n = 1) {
  const items = listed().slice((n - 1) * PER_PAGE, n * PER_PAGE);
  return `
  <section class="bhead">
    <div class="container bhead__inner">
      <div>{{crumbs}}<p class="eyebrow eyebrow--plain">Caliber blog</p><h1 class="bhead__title">Aging in Place Articles</h1></div>
      <span class="bcount">${POSTS.length} articles</span>
    </div>
  </section>
  <section class="section bsec">
    <div class="container">
      ${n === 1 ? featuredHtml() : ''}
      <h2 class="bmore">${n === 1 ? 'More articles' : `Articles – page ${n}`}</h2>
      <div class="blist">${items.map(card).join('')}</div>
      ${pager(n)}
    </div>
  </section>`;
}

/** Single post body. */
function postHtml(p) {
  const related = POSTS.filter((x) => x !== p && x.category === p.category).concat(POSTS.filter((x) => x !== p && x.category !== p.category)).slice(0, 3);
  const i = POSTS.indexOf(p);
  const newer = POSTS[i - 1]; const older = POSTS[i + 1];
  const body = p.body.map(([tag, text]) => `<${tag === 'h2' ? 'h2' : 'p'}>${esc(text)}</${tag === 'h2' ? 'h2' : 'p'}>`).join('\n        ');
  return `
  <section class="ph ph--plain bpost-hero">
    <div class="container ph__inner">
      <div class="ph__copy">
        {{crumbs}}
        <p class="bpost-hero__tags"><span class="tag tag--gold">${esc(p.category)}</span></p>
        <h1 class="ph__title">${esc(p.title)}</h1>
        <p class="bpost-hero__meta">${cal}<time datetime="${p.date}">${fmtDate(p.date)}</time><span aria-hidden="true">·</span>${readMins(p)} min read<span aria-hidden="true">·</span>By Caliber Home Solutions</p>
      </div>
    </div>
  </section>
  <section class="section bpost">
    <div class="container bpost__grid">
      <article class="bpost__article">
        <figure class="bpost__figure media"><img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.title)}" fetchpriority="high"></figure>
        <div class="bpost__content">
        ${body}
        </div>
        <nav class="bpost__nav" aria-label="More posts">
          ${newer ? `<a class="bpost__navlink" href="${url(newer)}"><small>← Newer</small><span>${esc(newer.title)}</span></a>` : '<span></span>'}
          ${older ? `<a class="bpost__navlink bpost__navlink--right" href="${url(older)}"><small>Older →</small><span>${esc(older.title)}</span></a>` : '<span></span>'}
        </nav>
        <p><a class="link-arrow" href="/blog/">← Back to all articles</a></p>
      </article>
      <aside class="bpost__side">{{quickForm}}</aside>
    </div>
  </section>
  <section class="section section--tint">
    <div class="container">
      <div class="section-head section-head--center"><p class="eyebrow eyebrow--plain">Keep reading</p><h2 class="h2">Related Articles</h2></div>
      <div class="brel" data-carousel>${related.map(card).join('')}</div>
    </div>
  </section>
  {{getStarted title="Get Started Today"}}`;
}

/** Page objects (for SEO + breadcrumbs) for any blog URL, or null. */
function resolve(path) {
  let m = path.match(/^\/blog\/page\/(\d+)\/$/);
  if (m) {
    const n = Number(m[1]);
    if (n < 2 || n > pageCount()) return null;
    return { kind: 'list', n, page: { path, title: `Aging-in-Place & Home Remodeling Advice – Page ${n} | Caliber`, description: 'More practical articles on aging-in-place remodeling, bathroom upgrades, walk-in showers, walk-in tubs, stair lifts, and home accessibility.', crumb: `Page ${n}`, parent: '/blog/', ready: true, type: 'blog-list' } };
  }
  m = path.match(/^\/blog\/([a-z0-9-]+)\/$/);
  if (m && findPost(m[1])) {
    const p = findPost(m[1]);
    const t = `${p.title} | Caliber`;
    return { kind: 'post', post: p, page: { path, title: t.length > 65 ? p.title : t, description: p.excerpt.replace(/…$/, '').slice(0, 155).replace(/\s+\S*$/, '') + '…', crumb: p.title, parent: '/blog/', ready: true, type: 'post', post: p } };
  }
  return null;
}

module.exports = { POSTS, listHtml, postHtml, resolve, url, fmtDate };
