/**
 * Turns a validated request body into a complete, display-ready submission
 * record (every field, every board selection, sub-options and metadata).
 */
'use strict';

const path = require('path');
const crypto = require('crypto');
const catalog = require('../shared/catalog');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

/** Absolute PNG/JPG path for an option image (server-side only; never from client input). */
function imageFileFor(step, option, sub) {
  if (option.pattern) return path.join(PUBLIC_DIR, 'images', 'patterns', `${option.id}-${sub.etch || 'othello'}.png`);
  return path.join(PUBLIC_DIR, option.image.replace(/^\//, ''));
}

function subOptionDetails(step, sub) {
  return (step.subOptions || []).map((so) => {
    const c = so.choices.find((x) => x.id === sub[so.key]) || so.choices.find((x) => x.id === so.default);
    return { label: so.label.replace(/\s*\(.*\)/, ''), value: c.desc ? `${c.name} – ${c.desc}` : c.name };
  });
}

function buildSubmission(body, meta = {}) {
  const board = body.board || {};
  const picks = board.picks || {};
  const sub = board.sub || {};

  const selections = catalog.steps.map((step, i) => {
    const raw = picks[step.key];
    const base = { number: i + 1, key: step.key, category: step.title };

    if (step.multi) {
      const items = (Array.isArray(raw) ? raw : []).map((id) => catalog.findOption(step.key, id)).filter(Boolean);
      return {
        ...base,
        status: items.length ? 'selected' : 'not-chosen',
        choice: items.length ? items.map((o) => o.name).join(', ') : 'Not chosen',
        items: items.map((o) => ({ id: o.id, name: o.name, desc: o.desc, imageFile: imageFileFor(step, o, sub) })),
        details: []
      };
    }
    if (raw === catalog.SKIP) {
      return { ...base, status: 'skipped', choice: 'Not in my project (skipped)', items: [], details: [] };
    }
    const o = raw ? catalog.findOption(step.key, raw) : null;
    if (!o) return { ...base, status: 'not-chosen', choice: 'Not chosen', items: [], details: [] };
    return {
      ...base,
      status: 'selected',
      choice: o.name,
      items: [{ id: o.id, name: o.name, desc: o.desc, imageFile: imageFileFor(step, o, sub) }],
      details: subOptionDetails(step, sub)
    };
  });

  const preset = catalog.presets.find((p) => p.id === board.preset);
  const bestTime = catalog.bestTimes.find((b) => b.id === body.bestTime);
  const submittedAt = new Date();

  return {
    reference: crypto.randomUUID(),
    submissionId: body.submissionId || null,
    submittedAt,
    customer: {
      firstName: body.firstName,
      lastName: body.lastName,
      fullName: `${body.firstName} ${body.lastName}`.trim(),
      email: body.email,
      phone: body.phone,
      zip: body.zip,
      city: body.city,
      state: body.state,
      bestTime: bestTime ? bestTime.name : 'No preference',
      interests: (Array.isArray(body.interests) ? body.interests : []).map((id) => (catalog.interests.find((i) => i.id === id) || {}).name).filter(Boolean)
    },
    selections,
    completedCount: selections.filter((s) => s.status !== 'not-chosen').length,
    totalSteps: catalog.steps.length,
    accessible: !!board.accessible,
    preset: preset ? preset.name : 'Started from scratch',
    consent: 'Customer agreed Caliber Home Solutions may contact them by phone, text, or email about their project.',
    shareUrl: body.shareUrl || '',
    meta: {
      ip: meta.ip || '',
      userAgent: meta.userAgent || '',
      pageUrl: body.pageUrl || '',
      formSeconds: body.formStartedAt ? Math.round((Date.now() - Number(body.formStartedAt)) / 1000) : null
    }
  };
}

module.exports = { buildSubmission };
