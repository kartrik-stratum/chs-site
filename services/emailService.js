/**
 * Sends the owner notification e-mail with the complete submission.
 * Throws if the e-mail could not be handed to the SMTP server – the caller
 * must then report failure to the user (never a false success).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { getEmailSettings, validateEmailSettings, getTransporter } = require('../config/emailConfig');
const template = require('../templates/ownerEmail');

class EmailConfigError extends Error {}

function buildAttachments(submission, includeImages) {
  const attachments = [];
  const cids = new Map();
  if (includeImages) {
    submission.selections.forEach((sel) => sel.items.forEach((it) => {
      if (cids.has(it.imageFile) || !fs.existsSync(it.imageFile)) return;
      const cid = `${sel.key}-${it.id}@visionboard`;
      cids.set(it.imageFile, cid);
      attachments.push({ filename: `${sel.key}-${path.basename(it.imageFile)}`, path: it.imageFile, cid, contentDisposition: 'inline' });
    }));
  }
  const json = {
    reference: submission.reference,
    submittedAt: submission.submittedAt.toISOString(),
    customer: submission.customer,
    selections: submission.selections.map(({ number, category, status, choice, details, items }) => ({
      number, category, status, choice, details, options: items.map((i) => i.id)
    })),
    accessible: submission.accessible,
    startingStyle: submission.preset,
    shareUrl: submission.shareUrl,
    meta: submission.meta
  };
  attachments.push({
    filename: `vision-board-${submission.customer.lastName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${submission.reference.slice(0, 8)}.json`,
    content: JSON.stringify(json, null, 2),
    contentType: 'application/json'
  });
  return { attachments, cidFor: (file) => cids.get(file) || null };
}

async function sendOwnerNotification(submission) {
  const settings = getEmailSettings();
  const problems = validateEmailSettings(settings);
  if (problems.length) throw new EmailConfigError(`E-mail is not configured: ${problems.join('; ')}`);

  const { attachments, cidFor } = buildAttachments(submission, settings.includeImages);
  const opts = { timezone: settings.timezone, cidFor };

  const info = await getTransporter(settings).sendMail({
    from: settings.from,
    to: settings.ownerEmail,
    cc: settings.ownerCc || undefined,
    replyTo: submission.customer.email ? { name: submission.customer.fullName, address: submission.customer.email } : undefined,
    subject: template.subject(submission),
    text: template.renderText(submission, opts),
    html: template.renderHtml(submission, opts),
    attachments,
    headers: { 'X-Submission-Reference': submission.reference }
  });

  const accepted = info.accepted || [];
  if (!accepted.length) throw new Error(`SMTP server did not accept the message (rejected: ${(info.rejected || []).join(', ') || 'unknown'})`);
  return info;
}

module.exports = { sendOwnerNotification, EmailConfigError };
