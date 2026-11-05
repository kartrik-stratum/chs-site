/**
 * Caliber homepage behaviour:
 *  - header navigation (mobile menu, dropdowns, sticky shadow)
 *  - quick consultation cards -> open the full lead form in a NEW TAB, prefilled
 *  - [data-open-form] links -> open the form in a new tab (optionally preselecting an interest)
 *  - before / after comparison sliders (mouse, touch, keyboard)
 *  - mobile auto-sliding carousels for multi-card grids ([data-carousel])
 */
(function () {
  'use strict';

  const C = window.VB_CATALOG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PREFILL_KEY = 'caliber-lead-prefill';
  const FORM_URL = '/design-tool/#/summary';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function storePrefill(data) {
    try { localStorage.setItem(PREFILL_KEY, JSON.stringify({ ...data, at: Date.now() })); } catch (_) { /* storage blocked */ }
  }

  /* ------------------------------------------------------------- navigation */
  function initNav() {
    const header = $('#site-header');
    const burger = $('.header__burger');
    const menu = $('#site-menu');
    if (!header || !burger) return;

    const close = () => { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); };
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });

    $$('.nav__item--drop').forEach((item) => {
      const btn = $('button', item);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = btn.getAttribute('aria-expanded') !== 'true';
        $$('.nav__item--drop').forEach((o) => { o.classList.remove('is-open'); $('button', o).setAttribute('aria-expanded', 'false'); });
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav__item--drop')) $$('.nav__item--drop').forEach((o) => { o.classList.remove('is-open'); $('button', o).setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); $$('.nav__item--drop.is-open').forEach((o) => o.classList.remove('is-open')); } });

    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------- "open form" links (new tab) */
  function initFormLinks() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-open-form]');
      if (!a) return;
      // The link itself opens in a new tab (target=_blank); we only hand over context.
      const interest = a.dataset.interest;
      if (interest) storePrefill({ interests: [interest] });
    });
  }

  /* ------------------------------------------------- quick consultation cards */
  function quickFormHtml(n) {
    const chips = C.interests.map((it, i) => `
      <label class="qchip"><input type="checkbox" name="interests" value="${it.id}" ${i === 0 ? 'checked' : ''}><span>${esc(it.name)}</span></label>`).join('');
    return `
      <h2 class="quick-card__title">Book a free consultation</h2>
      <p class="quick-card__sub">A local specialist calls you back within 1 business day.</p>
      <form class="quick-form" novalidate data-quick-form>
        <div class="qfield"><label for="q${n}-name">Full name</label><input id="q${n}-name" name="fullName" autocomplete="name" placeholder="Jane Smith" maxlength="100"><p class="qerr"></p></div>
        <div class="qrow">
          <div class="qfield"><label for="q${n}-phone">Phone</label><input id="q${n}-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(208) 555-0142" maxlength="20"><p class="qerr"></p></div>
          <div class="qfield"><label for="q${n}-zip">Zip code</label><input id="q${n}-zip" name="zip" inputmode="numeric" autocomplete="postal-code" placeholder="83402" maxlength="10"><p class="qerr"></p></div>
        </div>
        <fieldset class="qfield"><legend>I’m interested in</legend><div class="qchips">${chips}</div></fieldset>
        <button type="submit" class="btn btn--gold btn--block btn--lg">Get My Free Quote <span aria-hidden="true">→</span></button>
        <p class="quick-card__note" role="status"></p>
        <p class="quick-card__fine">No obligation. We never share your details.</p>
      </form>`;
  }

  function splitPhone(v) {
    let d = String(v || '').replace(/\D/g, '');
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    return d;
  }

  function initQuickForms() {
    $$('[data-quick-form-wrap]').forEach((wrap, n) => {
      wrap.innerHTML = quickFormHtml(n);
      const form = $('form', wrap);
      const note = $('.quick-card__note', wrap);
      const phone = form.elements.phone;
      phone.addEventListener('input', (e) => {
        if (e.inputType && e.inputType.startsWith('delete')) return;
        const d = splitPhone(phone.value).slice(0, 10);
        phone.value = d.length > 6 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d.length > 3 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : d.length ? `(${d}` : '';
      });
      form.elements.zip.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^\d-]/g, '').slice(0, 10); });

      const setErr = (name, msg) => {
        const el = form.elements[name];
        const p = el.closest('.qfield').querySelector('.qerr');
        p.textContent = msg || '';
        el.classList.toggle('is-invalid', !!msg);
        if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      };

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = form.elements.fullName.value.trim().replace(/\s+/g, ' ');
        const d = splitPhone(phone.value);
        const zip = form.elements.zip.value.trim();
        const errs = {
          fullName: !fullName ? 'Please enter your name.' : fullName.split(' ').length < 2 ? 'Please enter your first and last name.' : '',
          phone: !phone.value ? 'Please enter your phone number.' : d.length !== 10 || /^[01]/.test(d) ? 'Please enter a valid 10-digit phone number.' : '',
          zip: !zip ? 'Please enter your zip code.' : !/^\d{5}(-\d{4})?$/.test(zip) ? 'Please enter a 5-digit zip code.' : ''
        };
        Object.entries(errs).forEach(([k, v]) => setErr(k, v));
        const bad = Object.keys(errs).find((k) => errs[k]);
        if (bad) { form.elements[bad].focus(); return; }

        storePrefill({ fullName, phone: phone.value, zip, interests: $$('input[name="interests"]:checked', form).map((i) => i.value) });
        // Open the full form in a new tab so this page (and the design tool) stays put.
        const w = window.open(FORM_URL, '_blank');
        if (w) {
          try { w.opener = null; } catch (_) { /* ignore */ }
          note.innerHTML = '✓ Your quote form opened in a new tab. Finish your details there.';
          form.reset();
          $('input[name="interests"]', form).checked = true;
        } else {
          note.innerHTML = `Your browser blocked the new tab. <a href="${FORM_URL}" target="_blank" rel="noopener">Open the quote form →</a>`;
        }
      });
    });
  }

  /* ----------------------------------------------------------------- reviews */
  // Real Google reviews (supplied with the Contact page design).
  const REVIEWS = [
    ['Caliber Home Solutions did a great job installing my Stiltz Home Lift Trio System. The finishing work had great detail and their contract price was honored!', 'Eric S.', 'Stiltz home lift'],
    ['I love my new Walk-in Shower. It is beautiful. The installer knew what he was doing and he finished the job quickly. The shower is worth the price and I no longer fear falling in the bathtub.', 'Mitzi Beller', 'Walk-in shower'],
    ['The Walk-in Showers are amazing; the surface is so easy to clean and beautiful. The customer service is informative and will go the extra mile to ensure you are satisfied.', 'Cynthia Higley', 'Walk-in shower'],
    ['Happy with every thing.', 'Gary Fuhriman', 'Google review'],
    ['Great experience with purchase & install of Stiltz Trio home lift!', 'Barb Clarke', 'Stiltz home lift'],
    ['Caliber has been a great company to work with. Very responsive and offer a great quality product with service after the sale.', 'Stormie Grogan', 'Google review']
  ];
  function initReviews() {
    const grid = $('#reviews-grid');
    if (!grid) return;
    grid.innerHTML = REVIEWS.map(([q, name, what]) => `
      <figure class="card review">
        <span class="stars" aria-label="5 out of 5 stars">★★★★★</span>
        <blockquote>“${esc(q)}”</blockquote>
        <figcaption><span class="review__avatar" aria-hidden="true">${esc(name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2))}</span><span><strong>${esc(name)}</strong><small>${esc(what)}</small></span></figcaption>
      </figure>`).join('');
  }

  /* ---------------------------------------------------- before / after slider */
  function initCompare() {
    $$('[data-ba]').forEach((fig) => {
      const range = $('.ba__range', fig);
      let dragging = false;

      const set = (pct, animate) => {
        const v = Math.max(0, Math.min(100, pct));
        fig.classList.toggle('is-animating', !!animate && !reducedMotion.matches);
        fig.style.setProperty('--pos', `${v}%`);
        fig.classList.toggle('is-before-hidden', v < 12);
        fig.classList.toggle('is-after-hidden', v > 88);
        range.value = String(Math.round(v));
      };
      const fromEvent = (e) => {
        const r = fig.getBoundingClientRect();
        return ((e.clientX - r.left) / r.width) * 100;
      };

      fig.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        dragging = true;
        fig.classList.add('is-dragging');
        try { fig.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        set(fromEvent(e), true);
      });
      fig.addEventListener('pointermove', (e) => { if (dragging) set(fromEvent(e), false); });
      const end = () => { dragging = false; fig.classList.remove('is-dragging'); };
      fig.addEventListener('pointerup', end);
      fig.addEventListener('pointercancel', end);
      fig.addEventListener('lostpointercapture', end);
      range.addEventListener('input', () => set(Number(range.value), true));
      set(50, false);
    });
  }

  /* -------------------------------------------- mobile auto-sliding carousels */
  const mobile = window.matchMedia('(max-width: 720px)');

  function initCarousel(track) {
    const items = () => Array.from(track.children);
    const dots = document.createElement('div');
    dots.className = 'carousel-dots';
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', 'Slides');
    track.after(dots);

    let index = 0;
    let timer = null;
    let pausedUntil = 0;
    let visible = false;

    const buildDots = () => {
      dots.innerHTML = items().map((_, i) => `<button type="button" role="tab" aria-label="Slide ${i + 1}" data-i="${i}"></button>`).join('');
      $$('button', dots).forEach((b) => b.addEventListener('click', () => { pause(); go(Number(b.dataset.i)); }));
      mark();
    };
    const mark = () => $$('button', dots).forEach((b, i) => { b.classList.toggle('is-active', i === index); b.setAttribute('aria-selected', String(i === index)); });
    const go = (i) => {
      const list = items();
      index = (i + list.length) % list.length;
      const el = list[index];
      track.scrollTo({ left: el.offsetLeft - track.offsetLeft - (track.clientWidth - el.clientWidth) / 2, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      mark();
    };
    const pause = () => { pausedUntil = Date.now() + 7000; };
    const tick = () => {
      if (!mobile.matches || !visible || Date.now() < pausedUntil || document.hidden || reducedMotion.matches) return;
      go(index + 1);
    };
    const start = () => { stop(); if (mobile.matches) timer = setInterval(tick, 4000); };
    const stop = () => { clearInterval(timer); timer = null; };

    let scrollT;
    track.addEventListener('scroll', () => {
      clearTimeout(scrollT);
      scrollT = setTimeout(() => {
        const mid = track.scrollLeft + track.clientWidth / 2 + track.offsetLeft;
        let best = 0; let dist = Infinity;
        items().forEach((el, i) => { const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - mid); if (d < dist) { dist = d; best = i; } });
        index = best;
        mark();
      }, 80);
    }, { passive: true });
    ['pointerdown', 'touchstart', 'focusin', 'mouseenter', 'wheel'].forEach((ev) => track.addEventListener(ev, pause, { passive: true }));

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0.4 }).observe(track);
    } else visible = true;

    const apply = () => {
      track.classList.toggle('is-carousel', mobile.matches);
      dots.hidden = !mobile.matches;
      if (mobile.matches) { buildDots(); start(); } else { stop(); track.scrollLeft = 0; }
    };
    mobile.addEventListener('change', apply);
    // content of some tracks (reviews) is injected; rebuild dots if children change
    new MutationObserver(() => { if (mobile.matches) buildDots(); }).observe(track, { childList: true });
    apply();
  }

  function initCarousels() { $$('[data-carousel]').forEach(initCarousel); }

  /* -------------------------------------------------------------------- boot */
  $$('[data-year]').forEach((el) => { if (!el.textContent) el.textContent = new Date().getFullYear(); });
  initNav();
  initFormLinks();
  initQuickForms();
  initReviews();
  initCompare();
  initCarousels();
})();
