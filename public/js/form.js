/**
 * Lead form – client-side validation, input formatting and submission to
 * POST /api/submit-form. A success message is ONLY shown after the server
 * confirms the owner notification e-mail was sent.
 */
(function () {
  'use strict';

  const C = window.VB_CATALOG;
  const ENDPOINT = '/api/submit-form';
  const FIELDS = ['firstName', 'lastName', 'email', 'phone', 'zip', 'city', 'state', 'bestTime'];
  const PREFILL_KEY = 'caliber-lead-prefill';

  const NAME_RE = /^[\p{L}][\p{L}\p{M}' .-]*$/u;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ZIP_RE = /^\d{5}(-\d{4})?$/;
  const STATE_RE = /^[A-Za-z]{2}$/;
  const US_STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR'.split(' ');

  const digits = (s) => String(s || '').replace(/\D/g, '');
  function normalizePhone(s) {
    let d = digits(s);
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    return d;
  }

  const rules = {
    firstName: (v) => (!v ? 'Please enter your first name.' : v.length < 2 ? 'First name must be at least 2 characters.' : !NAME_RE.test(v) ? 'Please use letters only.' : ''),
    lastName: (v) => (!v ? 'Please enter your last name.' : v.length < 2 ? 'Last name must be at least 2 characters.' : !NAME_RE.test(v) ? 'Please use letters only.' : ''),
    email: (v) => (!v ? 'Please enter your email address.' : !EMAIL_RE.test(v) ? 'Please enter a valid email, like jane@example.com.' : ''),
    phone: (v) => {
      const d = normalizePhone(v);
      if (!v) return 'Please enter your phone number.';
      if (d.length !== 10) return 'Please enter a 10-digit US phone number.';
      if (/^[01]/.test(d) || /^\d{3}[01]/.test(d)) return 'That phone number doesn’t look right - please check it.';
      return '';
    },
    zip: (v) => (!v ? 'Please enter your zip code.' : !ZIP_RE.test(v) ? 'Please enter a 5-digit zip code.' : ''),
    city: (v) => (!v ? 'Please enter your city.' : v.length < 2 ? 'Please enter a valid city.' : ''),
    state: (v) => (!v ? 'Required.' : !STATE_RE.test(v) || !US_STATES.includes(v.toUpperCase()) ? 'Use a 2-letter state, e.g. CO.' : ''),
    bestTime: (v) => (C.bestTimes.some((b) => b.id === v) ? '' : 'Please choose a time.')
  };

  let form, btn, alertBox, bound = false, submitting = false, submitted = false;
  let startedAt = 0;
  let submissionId = null;
  const touched = new Set();

  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15);
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  }));

  function value(name) {
    const el = form.elements[name];
    return el ? String(el.value || '').trim() : '';
  }

  function setError(name, msg) {
    const el = form.elements[name];
    const err = document.getElementById(`${name}-error`);
    if (!el || !err) return;
    err.textContent = msg || '';
    el.classList.toggle('is-invalid', !!msg);
    el.classList.toggle('is-valid', !msg && !!value(name) && touched.has(name));
    if (msg) {
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', `${name}-error`);
    } else {
      el.removeAttribute('aria-invalid');
    }
  }

  function validateField(name) {
    const msg = rules[name](value(name));
    setError(name, msg);
    return !msg;
  }

  function validateAll() {
    let firstBad = null;
    FIELDS.forEach((f) => {
      touched.add(f);
      if (!validateField(f) && !firstBad) firstBad = f;
    });
    return firstBad;
  }

  function showAlert(msg, kind = 'error') {
    alertBox.className = `form-alert form-alert--${kind}`;
    alertBox.innerHTML = msg;
    alertBox.hidden = false;
  }
  const hideAlert = () => { alertBox.hidden = true; alertBox.textContent = ''; };

  function setLoading(on) {
    submitting = on;
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
    btn.setAttribute('aria-busy', String(on));
    btn.querySelector('.btn__label').lastChild.textContent = on ? ' Sending your board…' : ' Show Me My Bathroom Render';
    form.querySelectorAll('input, select').forEach((el) => { el.readOnly = on; });
  }

  function formatPhoneInput(e) {
    const el = e.target;
    const d = normalizePhone(el.value).slice(0, 10);
    if (e.inputType && e.inputType.startsWith('delete')) return;
    let out = d;
    if (d.length > 6) out = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    else if (d.length > 3) out = `(${d.slice(0, 3)}) ${d.slice(3)}`;
    else if (d.length > 0) out = `(${d}`;
    el.value = out;
  }

  function payload() {
    const app = window.VBApp;
    return {
      submissionId,
      firstName: value('firstName'),
      lastName: value('lastName'),
      email: value('email'),
      phone: value('phone'),
      zip: value('zip'),
      city: value('city'),
      state: value('state').toUpperCase(),
      bestTime: value('bestTime'),
      interests: Array.from(form.querySelectorAll('input[name="interests"]:checked')).map((i) => i.value),
      website: form.elements.website.value, // honeypot
      formStartedAt: startedAt,
      board: app.getBoard(),
      shareUrl: app.shareUrl(),
      pageUrl: location.href.split('#')[0]
    };
  }

  function successHtml(data) {
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    return `
      <div class="lead-success__icon">${window.VB_ICONS('check', 30)}</div>
      <h2>You’re all set, ${esc(data.firstName)}!</h2>
      <p>Your design is on its way to your local Caliber consultant. We’ll create your bathroom render and reach out ${data.bestTime && data.bestTime !== 'no-preference' ? `in the <strong>${esc(C.bestTimes.find((b) => b.id === data.bestTime).name.split(' (')[0].toLowerCase())}</strong>` : 'soon'} at <strong>${esc(data.phone)}</strong> or <strong>${esc(data.email)}</strong>.</p>
      <ul class="lead-success__steps">
        <li><span>1</span> A designer reviews your ${window.VBApp.doneCount()} selections</li>
        <li><span>2</span> You receive your bathroom render + high-res board</li>
        <li><span>3</span> Get your free, no-obligation quote</li>
      </ul>
      <p class="lead-success__ref">Reference #${esc(String(data.reference || '').slice(0, 8).toUpperCase())}</p>
      <a href="#/builder/step-1" class="btn btn--outline-blue btn--block">Keep Customizing My Board</a>`;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting || submitted) return; // prevent duplicate submissions
    hideAlert();

    const bad = validateAll();
    if (bad) {
      showAlert('Please fix the highlighted fields and try again.');
      form.elements[bad].focus();
      return;
    }

    if (!submissionId) submissionId = uuid();
    const data = payload();
    setLoading(true);

    let res, body = {};
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 30000);
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        signal: ctrl.signal
      });
      clearTimeout(timer);
      body = await res.json().catch(() => ({}));
    } catch (err) {
      setLoading(false);
      showAlert('We couldn’t reach our server. Please check your connection and try again, or call us at <a href="tel:+12085523037">(208) 552-3037</a>.');
      return;
    }

    if (res.ok && body.ok) {
      submitted = true;
      setLoading(false);
      const wrap = document.getElementById('lead-form-wrap');
      const ok = document.getElementById('lead-success');
      ok.innerHTML = successHtml({ ...data, reference: body.reference || submissionId });
      wrap.hidden = true;
      ok.hidden = false;
      ok.focus();
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(false);
    if (res.status === 422 && Array.isArray(body.errors)) {
      let first = null;
      body.errors.forEach((er) => {
        if (FIELDS.includes(er.field)) { setError(er.field, er.message); if (!first) first = er.field; }
      });
      showAlert(body.message || 'Please fix the highlighted fields and try again.');
      if (first) form.elements[first].focus();
    } else if (res.status === 429) {
      showAlert('Too many attempts - please wait a few minutes and try again.');
    } else {
      // 5xx / email delivery failure: never show success.
      showAlert(esc2(body.message) || 'Something went wrong sending your board. Please try again in a moment, or call us at <a href="tel:+12085523037">(208) 552-3037</a>.');
    }
  }

  function esc2(s) {
    return s ? String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) : '';
  }

  /** Applies details handed over from a homepage quick form (same-origin localStorage). */
  function applyPrefill() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(PREFILL_KEY)); localStorage.removeItem(PREFILL_KEY); } catch (_) { d = null; }
    if (!d || typeof d !== 'object' || Date.now() - Number(d.at || 0) > 30 * 60 * 1000) return;
    const setIfEmpty = (name, v) => { const el = form.elements[name]; if (el && v && !el.value) { el.value = String(v).slice(0, 100); touched.add(name); validateField(name); } };
    if (typeof d.fullName === 'string') {
      const parts = d.fullName.trim().split(/\s+/);
      setIfEmpty('firstName', parts.shift());
      setIfEmpty('lastName', parts.join(' '));
    }
    setIfEmpty('phone', d.phone);
    setIfEmpty('zip', d.zip);
    if (Array.isArray(d.interests)) {
      form.querySelectorAll('input[name="interests"]').forEach((cb) => { cb.checked = d.interests.includes(cb.value); });
    }
    const next = ['firstName', 'lastName', 'email', 'phone', 'zip'].find((f) => !value(f));
    if (next) setTimeout(() => form.elements[next].focus({ preventScroll: true }), 50);
  }

  function init() {
    if (!startedAt) startedAt = Date.now();
    if (bound) { applyPrefill(); return; }
    form = document.getElementById('lead-form');
    btn = document.getElementById('submit-btn');
    alertBox = document.getElementById('form-alert');
    if (!form) return;

    document.getElementById('interest-chips').innerHTML = C.interests.map((it) =>
      `<label class="ichip"><input type="checkbox" name="interests" value="${it.id}"><span>${it.name}</span></label>`).join('');

    const sel = form.elements.bestTime;
    sel.innerHTML = C.bestTimes.map((b) => `<option value="${b.id}">${b.name}</option>`).join('');

    form.elements.phone.addEventListener('input', formatPhoneInput);
    form.elements.zip.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^\d-]/g, '').slice(0, 10); });
    form.elements.state.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2); });

    FIELDS.forEach((f) => {
      const el = form.elements[f];
      el.addEventListener('blur', () => { if (value(f) || touched.has(f)) { touched.add(f); validateField(f); } });
      el.addEventListener('input', () => {
        if (touched.has(f)) validateField(f);
        // a changed answer is a new submission attempt
        if (!submitted) submissionId = null;
      });
      el.addEventListener('change', () => { if (touched.has(f)) validateField(f); });
    });

    form.addEventListener('submit', onSubmit);
    bound = true;
    applyPrefill();
    window.addEventListener('storage', (e) => { if (e.key === PREFILL_KEY && e.newValue && !submitted) applyPrefill(); });
  }

  window.VBForm = { init, _rules: rules };
})();
