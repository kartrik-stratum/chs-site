/**
 * Server-side validation for POST /api/submit-form (express-validator).
 * Mirrors the client rules and additionally verifies every board selection
 * against the catalog, so only known options ever reach the e-mail.
 */
'use strict';

const { body, validationResult } = require('express-validator');
const catalog = require('../shared/catalog');

const NAME_RE = /^[\p{L}][\p{L}\p{M}' .-]*$/u;
const US_STATES = new Set('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR'.split(' '));
const stripCtl = (v) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();

function normalizePhone(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length === 11 && d[0] === '1') d = d.slice(1);
  return d;
}

const name = (field, label) => body(field)
  .customSanitizer(stripCtl)
  .notEmpty().withMessage(`Please enter your ${label}.`).bail()
  .isLength({ min: 2, max: 50 }).withMessage(`${label[0].toUpperCase() + label.slice(1)} must be 2–50 characters.`).bail()
  .matches(NAME_RE).withMessage('Please use letters only.');

function validateBoard(board) {
  if (!board || typeof board !== 'object' || Array.isArray(board)) throw new Error('Your vision board is missing - please go back and make your selections.');
  const picks = board.picks;
  if (!picks || typeof picks !== 'object') throw new Error('Your vision board selections are missing.');
  const allowedKeys = new Set(catalog.steps.map((s) => s.key));
  for (const k of Object.keys(picks)) if (!allowedKeys.has(k)) throw new Error(`Unknown board category "${k}".`);

  let chosen = 0;
  for (const step of catalog.steps) {
    const v = picks[step.key];
    if (v === undefined || v === null) continue;
    if (step.multi) {
      if (!Array.isArray(v) || v.length > step.options.length) throw new Error(`Invalid ${step.title} selection.`);
      if (new Set(v).size !== v.length) throw new Error(`Duplicate ${step.title} selection.`);
      v.forEach((id) => { if (!catalog.findOption(step.key, id)) throw new Error(`Invalid ${step.title} option.`); });
      if (v.length) chosen++;
    } else {
      if (v !== catalog.SKIP && !catalog.findOption(step.key, v)) throw new Error(`Invalid ${step.title} option.`);
      chosen++;
    }
  }
  if (!chosen) throw new Error('Please choose at least one item for your vision board before submitting.');

  const sub = board.sub || {};
  if (typeof sub !== 'object') throw new Error('Invalid board options.');
  for (const step of catalog.steps) {
    for (const so of step.subOptions || []) {
      if (sub[so.key] !== undefined && !so.choices.some((c) => c.id === sub[so.key])) throw new Error(`Invalid ${so.label} option.`);
    }
  }
  if (board.preset != null && !catalog.presets.some((p) => p.id === board.preset)) throw new Error('Invalid style preset.');
  if (board.accessible !== undefined && typeof board.accessible !== 'boolean') throw new Error('Invalid accessibility option.');
  return true;
}

const submitFormRules = [
  name('firstName', 'first name'),
  name('lastName', 'last name'),
  body('email')
    .customSanitizer(stripCtl)
    .notEmpty().withMessage('Please enter your email address.').bail()
    .isLength({ max: 254 }).withMessage('Email address is too long.').bail()
    .isEmail({ allow_display_name: false, require_tld: true }).withMessage('Please enter a valid email, like jane@example.com.').bail()
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false, all_lowercase: true }),
  body('phone')
    .customSanitizer(stripCtl)
    .notEmpty().withMessage('Please enter your phone number.').bail()
    .custom((v) => {
      const d = normalizePhone(v);
      if (d.length !== 10) throw new Error('Please enter a 10-digit US phone number.');
      if (/^[01]/.test(d) || /^\d{3}[01]/.test(d)) throw new Error('That phone number doesn’t look right - please check it.');
      return true;
    })
    .customSanitizer((v) => { const d = normalizePhone(v); return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`; }),
  body('zip')
    .customSanitizer(stripCtl)
    .notEmpty().withMessage('Please enter your zip code.').bail()
    .matches(/^\d{5}(-\d{4})?$/).withMessage('Please enter a 5-digit zip code.'),
  body('city')
    .customSanitizer(stripCtl)
    .notEmpty().withMessage('Please enter your city.').bail()
    .isLength({ min: 2, max: 80 }).withMessage('Please enter a valid city.').bail()
    .matches(/^[\p{L}\p{M}0-9' .,-]+$/u).withMessage('Please enter a valid city.'),
  body('state')
    .customSanitizer((v) => stripCtl(v).toUpperCase())
    .notEmpty().withMessage('Required.').bail()
    .custom((v) => { if (!US_STATES.has(v)) throw new Error('Use a 2-letter state, e.g. CO.'); return true; }),
  body('bestTime')
    .customSanitizer((v) => stripCtl(v) || 'no-preference')
    .isIn(catalog.bestTimes.map((b) => b.id)).withMessage('Please choose a time.'),
  body('board').custom(validateBoard),
  body('submissionId').optional({ values: 'falsy' }).isUUID().withMessage('Invalid submission id.'),
  body('shareUrl').optional({ values: 'falsy' }).isString().isLength({ max: 4000 })
    .isURL({ protocols: ['http', 'https'], require_tld: false, require_protocol: true }).withMessage('Invalid share link.'),
  body('pageUrl').optional({ values: 'falsy' }).isString().isLength({ max: 500 })
    .isURL({ protocols: ['http', 'https'], require_tld: false, require_protocol: true }).withMessage('Invalid page URL.')
];

/** Sends 422 with [{ field, message }] when validation fails. */
function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const seen = new Set();
  const errors = result.array({ onlyFirstError: true })
    .map((e) => ({ field: e.path, message: e.msg }))
    .filter((e) => (seen.has(e.field) ? false : seen.add(e.field)));
  const boardError = errors.find((e) => e.field === 'board');
  return res.status(422).json({
    ok: false,
    message: boardError ? boardError.message : 'Please fix the highlighted fields and try again.',
    errors
  });
}

module.exports = { submitFormRules, handleValidation, validateBoard, normalizePhone };
