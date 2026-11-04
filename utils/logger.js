/**
 * Minimal structured logger: JSON lines to stdout/stderr plus an append-only
 * submissions log. Failed submissions are also written in full to
 * logs/failed-submissions.jsonl so a lead is never lost if e-mail delivery fails.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');
const quiet = () => process.env.NODE_ENV === 'test' && !process.env.LOG_IN_TESTS;

function ensureDir() {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (_) { /* ignore */ }
}

function append(file, obj) {
  if (process.env.DISABLE_FILE_LOGS === 'true') return;
  ensureDir();
  fs.appendFile(path.join(LOG_DIR, file), JSON.stringify(obj) + '\n', (err) => {
    if (err) console.error(JSON.stringify({ level: 'error', msg: 'log write failed', error: err.message }));
  });
}

function log(level, msg, meta = {}) {
  const entry = { time: new Date().toISOString(), level, msg, ...meta };
  if (!quiet()) (level === 'error' || level === 'warn' ? console.error : console.log)(JSON.stringify(entry));
  return entry;
}

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  /** Records the outcome of every submission attempt. */
  submission(status, meta) {
    const entry = log(status === 'sent' ? 'info' : 'warn', `submission ${status}`, meta);
    append('submissions.log', entry);
  },
  /** Stores the complete payload of a submission whose e-mail failed, for manual recovery. */
  failedSubmission(data) {
    append('failed-submissions.jsonl', { time: new Date().toISOString(), ...data });
  },
  LOG_DIR
};
