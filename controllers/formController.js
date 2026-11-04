/**
 * POST /api/submit-form
 * Validated -> build full submission -> e-mail the owner -> respond.
 * The response is only { ok: true } once the SMTP server accepted the e-mail.
 */
'use strict';

const { buildSubmission } = require('../services/submissionService');
const { sendOwnerNotification, EmailConfigError } = require('../services/emailService');
const duplicates = require('../utils/duplicateGuard');
const logger = require('../utils/logger');

async function submitForm(req, res) {
  const data = req.body;
  const logMeta = { submissionId: data.submissionId || null, name: `${data.firstName} ${data.lastName}`, email: data.email, ip: req.ip };

  const previous = duplicates.findDuplicate(data);
  if (previous) {
    logger.submission('duplicate-ignored', { ...logMeta, reference: previous });
    return res.status(200).json({ ok: true, duplicate: true, reference: previous, message: 'We already have your vision board - your designer will be in touch soon.' });
  }
  if (!duplicates.begin(data)) {
    return res.status(409).json({ ok: false, message: 'Your submission is already being processed - please wait a moment.' });
  }

  const submission = buildSubmission(data, { ip: req.ip, userAgent: req.get('user-agent') });
  try {
    const info = await sendOwnerNotification(submission);
    duplicates.markCompleted(data, submission.reference);
    logger.submission('sent', { ...logMeta, reference: submission.reference, messageId: info.messageId, selections: submission.completedCount });
    return res.status(200).json({ ok: true, reference: submission.reference, message: 'Thanks! Your vision board was sent to your Caliber consultant.' });
  } catch (err) {
    const configProblem = err instanceof EmailConfigError;
    logger.submission('email-failed', { ...logMeta, reference: submission.reference, error: err.message, code: err.code, responseCode: err.responseCode });
    logger.failedSubmission({ reference: submission.reference, error: err.message, body: { ...data, website: undefined } });
    return res.status(configProblem ? 503 : 502).json({
      ok: false,
      message: 'We couldn’t send your vision board right now. Please try again in a moment, or call us at (208) 552-3037.'
    });
  } finally {
    duplicates.end(data);
  }
}

module.exports = { submitForm };
