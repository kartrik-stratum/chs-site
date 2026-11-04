/**
 * Basic spam protection: per-IP rate limiting, a honeypot field and a
 * minimum time-on-form check.
 */
'use strict';

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const MIN_FILL_MS = parseInt(process.env.MIN_FORM_FILL_MS || '3000', 10);

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: parseInt(process.env.RATE_LIMIT_MAX || '8', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, message: 'Too many submissions from this device - please wait a few minutes and try again.' }
});

function spamGuard(req, res, next) {
  const b = req.body || {};
  const reject = (reason) => {
    logger.submission('rejected-spam', { reason, ip: req.ip });
    return res.status(400).json({ ok: false, message: 'Your submission could not be accepted. Please call us at (970) 361-3404.' });
  };
  if (typeof b.website === 'string' && b.website.trim() !== '') return reject('honeypot');
  const started = Number(b.formStartedAt);
  if (!started || !Number.isFinite(started)) return reject('missing-timestamp');
  const elapsed = Date.now() - started;
  if (elapsed < MIN_FILL_MS) return reject('too-fast');
  if (elapsed > 7 * 24 * 60 * 60 * 1000 || elapsed < -60 * 1000) return reject('bad-timestamp');
  return next();
}

module.exports = { submitLimiter, spamGuard };
