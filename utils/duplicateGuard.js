/**
 * In-memory duplicate-submission guard.
 *  - Same submissionId (client idempotency key) -> treated as the same submission.
 *  - Same e-mail + identical board within a short window -> duplicate (double clicks,
 *    double taps, re-sent requests with a new id).
 * Only SUCCESSFUL submissions are remembered, so a failed attempt can be retried.
 * For multi-instance deployments swap this for a shared store (e.g. Redis).
 */
'use strict';

const crypto = require('crypto');

const TTL_ID_MS = 30 * 60 * 1000;
const TTL_FINGERPRINT_MS = 2 * 60 * 1000;
const MAX_ENTRIES = 5000;

const completed = new Map(); // key -> { reference, expires }
const inFlight = new Set();

function prune(now = Date.now()) {
  for (const [k, v] of completed) if (v.expires <= now) completed.delete(k);
  while (completed.size > MAX_ENTRIES) completed.delete(completed.keys().next().value);
}

function fingerprint(data) {
  const basis = JSON.stringify([String(data.email || '').toLowerCase(), data.phone, data.board]);
  return 'fp:' + crypto.createHash('sha256').update(basis).digest('hex');
}

module.exports = {
  /** Returns the earlier reference if this is a duplicate of a completed submission. */
  findDuplicate(data) {
    prune();
    const byId = data.submissionId && completed.get('id:' + data.submissionId);
    if (byId) return byId.reference;
    const byFp = completed.get(fingerprint(data));
    return byFp ? byFp.reference : null;
  },
  /** True when the same submission is currently being processed. */
  begin(data) {
    const key = data.submissionId || fingerprint(data);
    if (inFlight.has(key)) return false;
    inFlight.add(key);
    return true;
  },
  end(data) {
    inFlight.delete(data.submissionId || fingerprint(data));
  },
  markCompleted(data, reference) {
    const now = Date.now();
    if (data.submissionId) completed.set('id:' + data.submissionId, { reference, expires: now + TTL_ID_MS });
    completed.set(fingerprint(data), { reference, expires: now + TTL_FINGERPRINT_MS });
    prune(now);
  },
  _reset() { completed.clear(); inFlight.clear(); }
};
