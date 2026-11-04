/**
 * Caliber Home Solutions – homepage design tool + full bathroom builder.
 * Hash routes:
 *   #/ (or #section)   homepage (with the embedded Caliber Bath Designer)
 *   #/builder          "Pick a Style to Start"
 *   #/builder/step-N   step N of 10
 *   #/summary[?b=...]  finished board + lead form (b = shared board)
 */
(function () {
  'use strict';

  const C = window.VB_CATALOG;
  const icon = window.VB_ICONS;
  const STEPS = C.steps;
  const TOTAL = STEPS.length;
  const SKIP = C.SKIP;
  const STORAGE_KEY = 'caliber-vision-board-v1';

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ------------------------------------------------------------------ state */

  function blankState() {
    const picks = {};
    STEPS.forEach((s) => { picks[s.key] = s.multi ? [] : null; });
    const sub = {};
    STEPS.forEach((s) => (s.subOptions || []).forEach((so) => { sub[so.key] = so.default; }));
    return { picks, sub, accessible: false, preset: null, lastAccessory: null };
  }

  /** Keep only values that exist in the catalog (protects against stale/edited storage or share links). */
  function sanitize(raw) {
    const st = blankState();
    if (!raw || typeof raw !== 'object') return st;
    STEPS.forEach((s) => {
      const v = raw.picks && raw.picks[s.key];
      if (s.multi) {
        if (Array.isArray(v)) st.picks[s.key] = [...new Set(v.filter((id) => C.findOption(s.key, id)))];
      } else if (v === SKIP || C.findOption(s.key, v)) {
        st.picks[s.key] = v;
      }
      (s.subOptions || []).forEach((so) => {
        const sv = raw.sub && raw.sub[so.key];
        if (so.choices.some((c) => c.id === sv)) st.sub[so.key] = sv;
      });
    });
    st.accessible = !!raw.accessible;
    st.preset = C.presets.some((p) => p.id === raw.preset) ? raw.preset : null;
    const acc = st.picks.accessories;
    st.lastAccessory = acc.includes(raw.lastAccessory) ? raw.lastAccessory : acc[acc.length - 1] || null;
    return st;
  }

  function load() {
    try { return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch (_) { return blankState(); }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* storage unavailable */ }
  }

  let state = load();

  const isDone = (s) => (s.multi ? state.picks[s.key].length > 0 : state.picks[s.key] !== null);
  const doneCount = () => STEPS.filter(isDone).length;
  const pct = () => Math.round((doneCount() / TOTAL) * 100);

  function optionImage(step, o) {
    if (o.pattern) return `/images/patterns/${o.id}-${state.sub.etch || 'othello'}.svg`;
    return o.image;
  }

  /** Representative option for a step (null if empty/skipped). */
  function displayOption(step) {
    const v = state.picks[step.key];
    if (step.multi) {
      if (!v.length) return null;
      return C.findOption(step.key, state.lastAccessory && v.includes(state.lastAccessory) ? state.lastAccessory : v[v.length - 1]);
    }
    return v && v !== SKIP ? C.findOption(step.key, v) : null;
  }

  function valueLabel(step) {
    const v = state.picks[step.key];
    if (step.multi) return v.map((id) => C.findOption(step.key, id).name).join(', ');
    if (v === SKIP) return 'Not in my project';
    const o = C.findOption(step.key, v);
    return o ? o.name : '';
  }

  function subLabel(step) {
    if (!step.subOptions || !state.picks[step.key] || state.picks[step.key] === SKIP) return '';
    return step.subOptions
      .map((so) => {
        const c = so.choices.find((x) => x.id === state.sub[so.key]);
        if (!c || (so.key === 'vgroove' && c.id === 'none')) return '';
        return `${so.label.replace(/\s*\(.*\)/, '')}: ${c.name}`;
      })
      .filter(Boolean)
      .join(' · ');
  }

  /* ----------------------------------------------------------------- router */

  function parseRoute() {
    const h = location.hash.replace(/^#/, '') || '/';
    const [path, query] = h.split('?');
    const params = new URLSearchParams(query || '');
    const m = path.match(/^\/builder\/step-(\d+)$/);
    if (m) {
      const n = Math.min(Math.max(parseInt(m[1], 10), 1), TOTAL);
      return { view: 'builder', step: n };
    }
    if (path === '/builder') return { view: 'builder', step: 0 };
    if (path === '/summary') return { view: 'summary', shared: params.get('b') };
    return { view: 'landing' };
  }

  const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };

  function showView(name) {
    document.querySelectorAll('.view').forEach((v) => { v.hidden = v.dataset.view !== name; });
    document.body.dataset.view = name;
  }

  let lastRouteKey = '';
  function render() {
    const r = parseRoute();
    const key = r.view + ':' + (r.step || '');
    if (r.view === 'summary' && r.shared) importShared(r.shared);
    showView(r.view);
    if (r.view === 'builder') {
      renderSidebar(r.step);
      if (r.step === 0) renderStylePicker(); else renderStep(r.step);
    } else if (r.view === 'summary') {
      renderSummary();
    } else {
      renderHomeDesigner();
    }
    if (key !== lastRouteKey) {
      window.scrollTo(0, 0);
      const main = $('#builder-main');
      if (main) main.scrollTop = 0;
      lastRouteKey = key;
    }
  }

  /* ---------------------------------------------------------------- sidebar */

  function renderSidebar(current) {
    const done = doneCount();
    const p = pct();
    const complete = done === TOTAL;
    const R = 15.5;
    const CIRC = 2 * Math.PI * R;

    const thumbs = STEPS.map((s, i) => {
      const o = displayOption(s);
      const skipped = !s.multi && state.picks[s.key] === SKIP;
      const extra = s.multi && state.picks[s.key].length > 1 ? `<span class="thumb__count">+${state.picks[s.key].length - 1}</span>` : '';
      const inner = o
        ? `<img src="${esc(optionImage(s, o))}" alt="" loading="lazy"><span class="thumb__label">${esc(o.name)}</span>${extra}`
        : skipped
          ? `<span class="thumb__empty">${icon('x', 12)}<small>N/A</small></span>`
          : `<span class="thumb__empty">${icon('image', 12)}<small>${esc(s.short)}</small></span>`;
      return `<a href="#/builder/step-${i + 1}" class="thumb ${o ? 'is-filled' : ''} ${skipped ? 'is-skipped' : ''} ${current === i + 1 ? 'is-current' : ''}" title="${esc(s.title)}${o ? ': ' + esc(o.name) : ''}">${inner}</a>`;
    }).join('');

    const cats = STEPS.map((s, i) => `
      <li><a href="#/builder/step-${i + 1}" class="cat ${current === i + 1 ? 'is-current' : ''} ${isDone(s) ? 'is-done' : ''}">
        <span class="cat__icon">${icon(s.icon, 14)}</span>
        <span class="cat__text"><span class="cat__name">${esc(s.title)}</span><span class="cat__value">${esc(valueLabel(s)) || 'Not chosen yet'}</span></span>
        <span class="cat__state">${isDone(s) ? icon('checkCircle', 15) : ''}</span>
      </a></li>`).join('');

    $('#sidebar').innerHTML = `
      <div class="sidebar__head">
        <a href="#/" class="sidebar__logo" aria-label="Back to Caliber Home Solutions home"><img src="/images/brand/caliber-logo.png" alt="Caliber Home Solutions" width="84" height="22"></a>
        <div class="sidebar__titles">
          <span class="sidebar__brand">Caliber Bath Designer</span>
          <span class="sidebar__title">Your Vision Board</span>
        </div>
        <span class="ring ${complete ? 'is-complete' : ''}" role="img" aria-label="${p}% complete">
          <svg viewBox="0 0 36 36" width="34" height="34"><circle cx="18" cy="18" r="${R}" class="ring__track"/><circle cx="18" cy="18" r="${R}" class="ring__bar" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC * (1 - p / 100)}"/></svg>
          <span>${p}%</span>
        </span>
      </div>
      <div class="sidebar__progress"><span style="width:${p}%"></span></div>
      <div class="sidebar__meta">
        <span>${done} of ${TOTAL} choices</span>
        ${complete ? `<span class="is-green">${icon('checkCircle', 11)} Board complete!</span>` : `<span class="is-blue">${done ? 'Keep going!' : 'Start picking!'}</span>`}
      </div>
      ${complete ? `
      <div class="ready-box">
        <p>${icon('party', 14)} Your vision board is ready!</p>
        <a href="#/summary" class="btn btn--green btn--sm">View My Board ${icon('arrowRight', 12)}</a>
      </div>` : ''}
      <div class="sidebar__section">
        <label class="a11y-toggle ${state.accessible ? 'is-on' : ''}">
          <span class="a11y-toggle__icon">${icon('accessible', 16)}</span>
          <span class="a11y-toggle__text"><strong>Make it Accessible</strong><small>Walk-in tub, grab bars, non-slip &amp; more</small></span>
          <input type="checkbox" role="switch" id="a11y-switch" ${state.accessible ? 'checked' : ''} aria-label="Make it accessible">
          <span class="switch" aria-hidden="true"></span>
        </label>
      </div>
      <div class="sidebar__thumbs">${thumbs}</div>
      <div class="sidebar__cats">
        <h3>Categories</h3>
        <ul>${cats}</ul>
      </div>`;

    $('#a11y-switch').addEventListener('change', (e) => setAccessible(e.target.checked));

    const fill = $('#topbar-fill');
    if (fill) fill.style.width = `${(current / TOTAL) * 100}%`;
  }

  function setAccessible(on) {
    state.accessible = on;
    const kit = C.accessibleKit;
    if (on) {
      state.picks.shower = kit.shower;
      state.picks.flooring = kit.flooring;
      const acc = new Set(state.picks.accessories);
      kit.accessories.forEach((a) => acc.add(a));
      state.picks.accessories = [...acc];
      state.lastAccessory = kit.accessories[0];
      toast('Accessible upgrades added: walk-in tub, non-slip floor, grab bars, seat & hand-held wand.');
    } else {
      state.picks.accessories = state.picks.accessories.filter((a) => !kit.accessories.includes(a));
      if (state.picks.shower === kit.shower) state.picks.shower = null;
      if (state.picks.flooring === kit.flooring) state.picks.flooring = null;
      state.lastAccessory = state.picks.accessories[state.picks.accessories.length - 1] || null;
    }
    state.preset = null;
    save();
    render();
  }

  /* ----------------------------------------------------------- style picker */

  function renderStylePicker() {
    const badge = (b) => (b === 'most-popular' ? '<span class="badge badge--gold">★ Most Popular</span>' : b === 'designers-pick' ? '<span class="badge badge--purple">★ Designer’s Pick</span>' : '');
    $('#builder-content').innerHTML = `
      <div class="styles">
        <span class="pill pill--soft">${icon('sparkle', 12)} Quick Start</span>
        <h1 class="styles__title">Pick a Style to Start</h1>
        <p class="styles__sub">One tap preloads your whole board - then customize each category. Or skip straight to step 1.</p>
        <div class="styles__grid">
          ${C.presets.map((p) => `
            <button type="button" class="style-card ${state.preset === p.id ? 'is-selected' : ''}" data-preset="${p.id}">
              <img src="${p.image}" alt="" loading="lazy">
              ${badge(p.badge)}
              <span class="style-card__text"><strong>${esc(p.name)}</strong><small>${esc(p.desc)}</small></span>
            </button>`).join('')}
        </div>
        <a href="#/builder/step-1" class="btn btn--outline-blue styles__scratch">Start from Scratch ${icon('arrowRight', 14)}</a>
      </div>`;
    $('#builder-content').querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  }

  function applyPreset(id) {
    const p = C.presets.find((x) => x.id === id);
    if (!p) return;
    const fresh = blankState();
    Object.entries(p.picks).forEach(([k, v]) => { fresh.picks[k] = Array.isArray(v) ? [...v] : v; });
    fresh.accessible = !!p.accessible;
    fresh.preset = p.id;
    fresh.lastAccessory = fresh.picks.accessories[0] || null;
    state = fresh;
    save();
    toast(`${p.name} loaded - customize any category below.`);
    go('#/builder/step-1');
  }

  /* ------------------------------------------------------------------ steps */

  let advanceTimer = null;

  function badgeHtml(b) {
    if (b === 'popular') return '<span class="badge badge--gold">★ Popular</span>';
    if (b === 'designer') return '<span class="badge badge--purple">★ Designer’s Pick</span>';
    return '';
  }

  function renderStep(n) {
    const step = STEPS[n - 1];
    const val = state.picks[step.key];
    const chosen = isDone(step);

    const subs = (step.subOptions || []).map((so) => `
      <div class="subopt">
        <span class="subopt__label">${esc(so.label)}</span>
        <div class="subopt__chips" role="radiogroup" aria-label="${esc(so.label)}">
          ${so.choices.map((c) => `
            <button type="button" role="radio" class="chip ${state.sub[so.key] === c.id ? 'is-active' : ''}" aria-checked="${state.sub[so.key] === c.id}" data-sub="${so.key}" data-val="${c.id}">
              ${esc(c.name)}${c.desc ? `<small> · ${esc(c.desc)}</small>` : ''}
            </button>`).join('')}
        </div>
      </div>`).join('');

    const cards = step.options.map((o) => {
      const sel = step.multi ? val.includes(o.id) : val === o.id;
      const media = o.color && !o.image ? `<span class="swatch" style="background:${o.color}"></span>` : `<img src="${esc(optionImage(step, o))}" alt="" loading="lazy" ${o.pattern ? 'class="is-pattern"' : ''}>`;
      return `
        <button type="button" class="opt-card ${sel ? 'is-selected' : ''}" role="${step.multi ? 'checkbox' : 'radio'}" aria-checked="${sel}" data-opt="${o.id}">
          <span class="opt-card__media">${media}${badgeHtml(o.badge)}<span class="opt-card__check">${icon('check', 12)}</span></span>
          <span class="opt-card__body"><strong>${esc(o.name)}</strong><small>${esc(o.desc)}</small></span>
        </button>`;
    }).join('');

    const skip = step.multi ? '' : `
      <button type="button" class="skip-card ${val === SKIP ? 'is-selected' : ''}" role="radio" aria-checked="${val === SKIP}" data-opt="${SKIP}">
        <span class="skip-card__icon">${icon('noImage', 16)}</span>
        <span class="skip-card__text"><strong>Not in my project</strong><small>Skip ${esc(step.skipLabel)} - I’m not updating this</small></span>
        <span class="skip-card__check">${icon('check', 12)}</span>
      </button>`;

    const dots = STEPS.map((s, i) => `<a href="#/builder/step-${i + 1}" class="dot ${i + 1 === n ? 'is-active' : ''} ${isDone(s) ? 'is-done' : ''}" aria-label="Step ${i + 1}: ${esc(s.title)}"></a>`).join('');
    const last = n === TOTAL;

    $('#builder-content').innerHTML = `
      <div class="step" data-step="${n}">
        <div class="step__pills">
          <span class="pill pill--soft">${icon(step.icon, 12)} Step ${n} of ${TOTAL}</span>
          ${chosen && !step.multi ? `<span class="pill pill--green">${icon('check', 11)} Selected</span>` : ''}
          ${step.multi && chosen ? `<span class="pill pill--green">${icon('check', 11)} ${val.length} selected</span>` : ''}
        </div>
        <h1 class="step__title">${esc(step.title)}</h1>
        <p class="step__sub">${esc(step.subtitle || 'Tap one to add it to your board. It auto-advances - or change anytime.')}</p>
        ${step.note ? `<p class="step__note"><span aria-hidden="true">💡</span> ${esc(step.note)}</p>` : ''}
        ${subs ? `<div class="subopts">${subs}</div>` : ''}
        <div class="opt-grid" role="${step.multi ? 'group' : 'radiogroup'}" aria-label="${esc(step.title)} options">${cards}</div>
        ${skip}
        <div class="step__nav">
          <a href="${n === 1 ? '#/builder' : `#/builder/step-${n - 1}`}" class="step__back">${icon('chevronLeft', 14)} Back</a>
          ${last
            ? `<a href="#/summary" class="btn btn--blue btn--pill">${icon('zap', 14)} Reveal My Board</a>`
            : `<a href="#/builder/step-${n + 1}" class="btn btn--blue btn--pill">Next ${icon('arrowRight', 14)}</a>`}
        </div>
        <nav class="dots" aria-label="Steps">${dots}</nav>
      </div>`;

    const content = $('#builder-content');
    content.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('click', () => choose(n, b.dataset.opt)));
    content.querySelectorAll('[data-sub]').forEach((b) => b.addEventListener('click', () => {
      state.sub[b.dataset.sub] = b.dataset.val;
      save();
      render();
    }));
  }

  function choose(n, id) {
    const step = STEPS[n - 1];
    clearTimeout(advanceTimer);
    if (step.multi) {
      const arr = state.picks[step.key];
      const i = arr.indexOf(id);
      if (i >= 0) arr.splice(i, 1); else { arr.push(id); state.lastAccessory = id; }
      if (!arr.includes(state.lastAccessory)) state.lastAccessory = arr[arr.length - 1] || null;
      save();
      render();
      return;
    }
    state.picks[step.key] = id;
    save();
    render();
    if (n < TOTAL) advanceTimer = setTimeout(() => {
      const r = parseRoute();
      if (r.view === 'builder' && r.step === n) go(`#/builder/step-${n + 1}`);
    }, 450);
  }

  /* ---------------------------------------------------------------- summary */

  function encodeBoard() {
    const compact = { p: state.picks, s: state.sub, a: state.accessible ? 1 : 0, r: state.preset };
    const bytes = new TextEncoder().encode(JSON.stringify(compact));
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function importShared(b) {
    try {
      const bin = atob(b.replace(/-/g, '+').replace(/_/g, '/'));
      const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      const d = JSON.parse(json);
      state = sanitize({ picks: d.p, sub: d.s, accessible: !!d.a, preset: d.r });
      save();
    } catch (_) {
      toast('That share link looks incomplete - showing your saved board instead.');
    }
    history.replaceState(null, '', '#/summary');
  }

  function shareUrl() {
    return `${location.origin}${location.pathname}#/summary?b=${encodeBoard()}`;
  }

  function renderSummary() {
    const done = doneCount();
    const complete = done === TOTAL;
    $('#summary-pill').innerHTML = complete ? `${icon('checkCircle', 12)} Board Complete!` : `${icon('sparkle', 12)} Board In Progress`;
    $('#summary-title').textContent = complete ? 'Your Vision Board is Ready!' : 'Your Vision Board So Far';
    $('#summary-sub').textContent = complete
      ? `All ${TOTAL} categories selected - your dream bathroom is fully mapped out.`
      : `${done} of ${TOTAL} categories selected - submit now or keep customizing anytime.`;

    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const tiles = STEPS.map((s) => {
      const o = displayOption(s);
      if (!o) return '';
      const name = s.multi ? valueLabel(s) : o.name;
      return `<figure class="tile tile--${s.key}">
          <img src="${esc(optionImage(s, o))}" alt="" loading="lazy">
          <span class="tile__icon">${icon(s.icon, 10)}</span>
          <figcaption><small>${esc(s.short)}</small>${esc(name)}</figcaption>
        </figure>`;
    }).join('');

    $('#board-card').innerHTML = `
      <header class="board-card__head">
        <img src="/images/brand/caliber-logo.png" alt="Caliber Home Solutions" width="96" height="26">
        <div class="board-card__brand">
          <span>${esc(C.business.tagline)}</span>
          <small>${esc(C.business.address)} &nbsp;·&nbsp; ${esc(C.business.phone)}</small>
        </div>
        <div class="board-card__label"><strong>Bathroom Vision Board</strong><small>${esc(date)}</small></div>
      </header>
      <div class="mosaic">${tiles || `<p class="mosaic__empty">Your board is empty. <a href="#/builder" class="link-blue">Pick a style to start →</a></p>`}</div>
      <footer class="board-card__foot"><em>Designed with the Caliber Bath Designer</em><a href="#/" class="link-blue">${esc(C.business.website)}</a></footer>`;

    $('#selections-list').innerHTML = STEPS.map((s, i) => {
      const o = displayOption(s);
      const v = valueLabel(s);
      const sub = subLabel(s);
      return `<li>
        <a href="#/builder/step-${i + 1}" class="sel-row">
          <span class="sel-row__thumb">${o ? `<img src="${esc(optionImage(s, o))}" alt="" loading="lazy">` : icon(state.picks[s.key] === SKIP ? 'x' : 'image', 12)}</span>
          <span class="sel-row__text"><small>${esc(s.title)}</small><strong>${esc(v) || '<em>Not chosen yet</em>'}</strong>${sub ? `<span class="sel-row__sub">${esc(sub)}</span>` : ''}</span>
          <span class="sel-row__state ${isDone(s) ? 'is-done' : ''}">${icon(isDone(s) ? 'checkCircle' : 'image', 15)}</span>
        </a></li>`;
    }).join('');

    if (window.VBForm) window.VBForm.init();
  }

  /* ------------------------------------------------ homepage bath designer */

  const HOME_TABS = [
    { id: 'base', label: 'Base', icon: 'bath', step: 'shower', options: ['walk-in-shower', 'tub-to-shower-conversion', 'walk-in-tub', 'replacement-bathtub'] },
    { id: 'walls', label: 'Walls', icon: 'grid', step: 'wallColor', options: ['calcutta-marble', 'bianco-travertine', 'galena', 'tuscany'] },
    { id: 'fixtures', label: 'Fixtures', icon: 'drop', step: 'faucet', options: ['chrome', 'brushed-nickel', 'matte-black', 'brushed-bronzed-gold'] },
    { id: 'safety', label: 'Safety', icon: 'hand', step: 'accessories', options: ['grab-bars', 'folding-shower-seat', 'hand-held-wand', 'recessed-niche'] },
    { id: 'review', label: 'Review', icon: 'eye' }
  ];
  let homeTab = 'base';
  let homeTimer = null;

  function homeCaption() {
    const parts = [];
    ['shower', 'wallColor', 'faucet'].forEach((k) => {
      const o = displayOption(C.findStep(k));
      if (o) parts.push(o.name);
    });
    const acc = state.picks.accessories.map((id) => C.findOption('accessories', id).name);
    if (acc.length) parts.push(acc.length > 2 ? `${acc.slice(0, 2).join(' · ')} +${acc.length - 2}` : acc.join(' · '));
    return parts.length ? parts.join(' · ') : 'Pick a base to start your design';
  }

  function renderHomeDesigner() {
    const root = $('#home-designer');
    if (!root) return;
    const idx = HOME_TABS.findIndex((t) => t.id === homeTab);
    const tab = HOME_TABS[idx];
    const step = tab.step ? C.findStep(tab.step) : null;

    let preview = '/images/home/solution-walk-in-showers.jpg';
    if (step) {
      const o = displayOption(step);
      preview = o ? optionImage(step, o) : C.findOption(step.key, tab.options[0]).image;
    } else {
      const o = displayOption(C.findStep('shower'));
      if (o) preview = o.image;
    }

    let panel;
    if (step) {
      panel = `<div class="designer__thumbs" role="${step.multi ? 'group' : 'radiogroup'}" aria-label="${esc(tab.label)} options">${tab.options.map((id) => {
        const o = C.findOption(step.key, id);
        const sel = step.multi ? state.picks[step.key].includes(id) : state.picks[step.key] === id;
        return `<button type="button" class="designer__thumb ${sel ? 'is-selected' : ''}" role="${step.multi ? 'checkbox' : 'radio'}" aria-checked="${sel}" data-home-opt="${id}">
            <img src="${esc(optionImage(step, o))}" alt="" loading="lazy"><span>${esc(o.name)}</span></button>`;
      }).join('')}</div>`;
    } else {
      const rows = HOME_TABS.filter((t) => t.step).map((t) => {
        const s2 = C.findStep(t.step);
        return `<li><span>${esc(t.label)}</span><strong>${esc(valueLabel(s2)) || '<em>Not chosen</em>'}</strong></li>`;
      }).join('');
      panel = `<div class="designer__review"><ul>${rows}</ul>
          <p>${doneCount()} of ${TOTAL} categories chosen · <a href="#/builder/step-1">Fine-tune all 10 steps →</a></p></div>`;
    }

    root.innerHTML = `
      <div class="designer__bar">
        <span class="designer__dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <strong>Caliber Bath Designer</strong>
        <span class="designer__step">Step ${idx + 1} of ${HOME_TABS.length} · ${esc(tab.label)}</span>
      </div>
      <div class="designer__body">
        <nav class="designer__tabs" aria-label="Design steps">${HOME_TABS.map((t) => `
          <button type="button" class="designer__tab ${t.id === homeTab ? 'is-active' : ''}" data-home-tab="${t.id}" aria-current="${t.id === homeTab ? 'step' : 'false'}">${icon(t.icon, 16)}<span>${esc(t.label)}</span></button>`).join('')}
        </nav>
        <div class="designer__stage">
          <div class="designer__preview media"><img src="${esc(preview)}" alt="" ><span class="designer__caption">${esc(homeCaption())}</span></div>
          ${panel}
        </div>
      </div>
      <div class="designer__foot">
        <span>${doneCount() ? `${icon('checkCircle', 14)} Saved to your free quote` : 'Your picks save automatically'}</span>
        <a class="btn btn--blue" href="/#/summary" target="_blank" rel="noopener" data-open-form>Send to Consultant</a>
      </div>`;

    root.querySelectorAll('[data-home-tab]').forEach((b) => b.addEventListener('click', () => {
      clearTimeout(homeTimer);
      homeTab = b.dataset.homeTab;
      renderHomeDesigner();
    }));
    root.querySelectorAll('[data-home-opt]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.homeOpt;
      clearTimeout(homeTimer);
      if (step.multi) {
        const arr = state.picks[step.key];
        const i = arr.indexOf(id);
        if (i >= 0) arr.splice(i, 1); else { arr.push(id); state.lastAccessory = id; }
        if (!arr.includes(state.lastAccessory)) state.lastAccessory = arr[arr.length - 1] || null;
      } else {
        state.picks[step.key] = id;
        homeTimer = setTimeout(() => { homeTab = HOME_TABS[idx + 1].id; renderHomeDesigner(); }, 600);
      }
      state.preset = null;
      save();
      renderHomeDesigner();
    }));
  }

  /* ------------------------------------------------------------------ misc */

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove('is-visible');
      setTimeout(() => { t.hidden = true; }, 250);
    }, 2800);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  function bindStatic() {
    $('#copy-share').addEventListener('click', async () => {
      const ok = await copyText(shareUrl());
      toast(ok ? 'Share link copied - send it to anyone!' : 'Could not copy automatically - please copy the link from the address bar.');
      if (!ok) history.replaceState(null, '', `#/summary?b=${encodeBoard()}`);
    });

    document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  }

  /* Public API used by form.js */
  window.VBApp = {
    getBoard: () => JSON.parse(JSON.stringify({ picks: state.picks, sub: state.sub, accessible: state.accessible, preset: state.preset })),
    isComplete: () => doneCount() === TOTAL,
    doneCount,
    shareUrl,
    toast
  };

  bindStatic();
  window.addEventListener('hashchange', render);
  // Keep tabs in sync (e.g. the form opened in a new tab edits the same board).
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = load();
    render();
  });
  render();
})();
