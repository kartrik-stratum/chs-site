/**
 * Nodemailer SMTP configuration. All values come from environment variables –
 * nothing secret is hard-coded and nothing here is ever sent to the browser.
 */
'use strict';

const nodemailer = require('nodemailer');

const bool = (v, fallback = false) => (v === undefined || v === '' ? fallback : /^(1|true|yes|on)$/i.test(String(v)));

function getEmailSettings(env = process.env) {
  const port = parseInt(env.SMTP_PORT || '587', 10);
  return {
    host: env.SMTP_HOST || '',
    port,
    secure: bool(env.SMTP_SECURE, port === 465),
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    requireTLS: bool(env.SMTP_REQUIRE_TLS, false),
    ignoreTLS: bool(env.SMTP_IGNORE_TLS, false),
    ownerEmail: env.OWNER_EMAIL || '',
    ownerCc: env.OWNER_CC || '',
    from: env.MAIL_FROM || (env.SMTP_USER ? `"Caliber Bath Designer" <${env.SMTP_USER}>` : ''),
    timezone: env.OWNER_TIMEZONE || 'America/Denver',
    includeImages: bool(env.EMAIL_INCLUDE_IMAGES, true)
  };
}

/** Returns a list of human-readable problems with the e-mail configuration. */
function validateEmailSettings(s = getEmailSettings()) {
  const problems = [];
  if (!s.host) problems.push('SMTP_HOST is not set');
  if (!s.port || Number.isNaN(s.port)) problems.push('SMTP_PORT is invalid');
  if (!s.ownerEmail) problems.push('OWNER_EMAIL is not set');
  if (!s.from) problems.push('MAIL_FROM (or SMTP_USER) is not set');
  if (s.user && !s.pass) problems.push('SMTP_PASS is not set (SMTP_USER is)');
  return problems;
}

let cached = null;
let cachedKey = '';

/** Lazily creates (and caches) the transporter for the current settings. */
function getTransporter(s = getEmailSettings()) {
  const key = JSON.stringify([s.host, s.port, s.secure, s.user, s.pass, s.requireTLS, s.ignoreTLS]);
  if (cached && key === cachedKey) return cached;
  cached = nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    requireTLS: s.requireTLS,
    ignoreTLS: s.ignoreTLS,
    auth: s.user ? { user: s.user, pass: s.pass } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000
  });
  cachedKey = key;
  return cached;
}

module.exports = { getEmailSettings, validateEmailSettings, getTransporter };
