/**
 * Owner notification e-mail (HTML + plain-text). Table-based, inline-styled
 * markup for broad e-mail client support. All user content is HTML-escaped.
 */
'use strict';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function formatDate(date, timezone) {
  const opts = { timeZone: timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
  try { return new Intl.DateTimeFormat('en-US', opts).format(date); } catch (_) { return date.toUTCString(); }
}

function subject(s) {
  return `New Form Submission – Website Inquiry: ${s.customer.fullName} (Bathroom Vision Board)`;
}

const BLUE = '#0B6FB6';
const NAVY = '#0A2540';
const TEAL = '#14A39A';
const GOLD = '#F6B23C';
const INK = '#0A2540';
const MUTED = '#6b7280';
const LINE = '#e7eaf0';

function row(label, valueHtml) {
  return `<tr>
    <td style="padding:9px 14px;border-bottom:1px solid ${LINE};font:600 12px/1.4 Arial,Helvetica,sans-serif;color:${MUTED};text-transform:uppercase;letter-spacing:.04em;width:38%;vertical-align:top;">${esc(label)}</td>
    <td style="padding:9px 14px;border-bottom:1px solid ${LINE};font:400 14px/1.45 Arial,Helvetica,sans-serif;color:${INK};vertical-align:top;">${valueHtml}</td>
  </tr>`;
}

function section(title, inner) {
  return `<tr><td style="padding:22px 28px 0;">
    <h2 style="margin:0 0 10px;font:700 15px/1.3 Arial,Helvetica,sans-serif;color:${INK};">${esc(title)}</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};border-radius:8px;border-collapse:separate;overflow:hidden;">${inner}</table>
  </td></tr>`;
}

/**
 * @param {object} s  submission from buildSubmission()
 * @param {object} o  { timezone, cidFor: (imageFile) => cid|null }
 */
function renderHtml(s, o = {}) {
  const tz = o.timezone || 'America/Denver';
  const cidFor = o.cidFor || (() => null);
  const c = s.customer;
  const phoneHref = 'tel:+1' + String(c.phone).replace(/\D/g, '').slice(-10);

  const customerRows = [
    row('Customer Name', esc(c.fullName)),
    row('First Name', esc(c.firstName)),
    row('Last Name', esc(c.lastName)),
    row('Email Address', c.email ? `<a href="mailto:${esc(c.email)}" style="color:${BLUE};">${esc(c.email)}</a>` : 'Not provided'),
    row('Phone Number', `<a href="${esc(phoneHref)}" style="color:${BLUE};">${esc(c.phone)}</a>`),
    row('City', esc(c.city) || 'Not provided'),
    row('State', esc(c.state) || 'Not provided'),
    row('Zip Code', esc(c.zip)),
    row('Best Time to Call', esc(c.bestTime)),
    row('Form', esc(c.source)),
    row('Interested In', c.interests.length ? esc(c.interests.join(', ')) : 'Not specified')
  ].join('');

  const selectionRows = s.selections.map((sel) => {
    const thumbs = sel.items.map((it) => {
      const cid = cidFor(it.imageFile);
      return cid ? `<img src="cid:${cid}" width="64" height="48" alt="${esc(it.name)}" style="display:inline-block;width:64px;height:48px;object-fit:cover;border-radius:6px;border:1px solid ${LINE};margin:0 6px 4px 0;">` : '';
    }).join('');
    const statusColor = sel.status === 'selected' ? TEAL : sel.status === 'skipped' ? MUTED : '#b45309';
    const details = sel.details.map((d) => `<div style="font:400 12px/1.5 Arial,Helvetica,sans-serif;color:${MUTED};">${esc(d.label)}: <strong style="color:${INK};">${esc(d.value)}</strong></div>`).join('');
    const descs = sel.items.length === 1 ? `<div style="font:400 12px/1.5 Arial,Helvetica,sans-serif;color:${MUTED};">${esc(sel.items[0].desc)}</div>` : '';
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid ${LINE};vertical-align:top;width:38%;">
        <div style="font:600 11px/1.3 Arial,Helvetica,sans-serif;color:${MUTED};text-transform:uppercase;letter-spacing:.05em;">Step ${sel.number}</div>
        <div style="font:700 14px/1.35 Arial,Helvetica,sans-serif;color:${INK};">${esc(sel.category)}</div>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid ${LINE};vertical-align:top;">
        ${thumbs ? `<div>${thumbs}</div>` : ''}
        <div style="font:700 14px/1.4 Arial,Helvetica,sans-serif;color:${statusColor};">${esc(sel.choice)}</div>
        ${descs}${details}
      </td>
    </tr>`;
  }).join('');

  const extraRows = [
    row('Board Progress', `${s.completedCount} of ${s.totalSteps} categories completed`),
    row('Starting Style', esc(s.preset)),
    row('Make it Accessible', s.accessible ? `<strong style="color:${TEAL};">Yes</strong> – walk-in tub, grab bars, non-slip &amp; more` : 'No'),
    row('Shareable Board Link', s.shareUrl ? `<a href="${esc(s.shareUrl)}" style="color:${BLUE};word-break:break-all;">Open the customer’s vision board</a>` : '—'),
    row('Contact Consent', esc(s.consent))
  ].join('');

  const metaRows = [
    row('Submitted', esc(formatDate(s.submittedAt, tz))),
    row('Submitted (UTC)', esc(s.submittedAt.toISOString())),
    row('Reference', esc(s.reference)),
    row('Page', esc(s.meta.pageUrl || '—')),
    row('IP Address', esc(s.meta.ip || '—')),
    row('Browser', esc(s.meta.userAgent || '—')),
    row('Time on Form', s.meta.formSeconds != null ? `${esc(s.meta.formSeconds)} seconds` : '—')
  ].join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject(s))}</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(c.fullName)} · ${esc(c.phone)} · ${esc([c.city, c.state].filter(Boolean).join(', ') || c.zip)} – ${s.completedCount}/${s.totalSteps} board selections</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:24px 10px;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${LINE};">
  <tr><td style="background:${NAVY};padding:24px 28px;border-bottom:4px solid ${GOLD};">
    <div style="font:700 11px/1.3 Arial,Helvetica,sans-serif;color:${TEAL};letter-spacing:.12em;text-transform:uppercase;">Caliber Home Solutions · Bath Designer</div>
    <h1 style="margin:6px 0 4px;font:600 24px/1.25 Georgia,'Times New Roman',serif;color:#ffffff;">New Form Submission – Website Inquiry</h1>
    <div style="font:400 13px/1.5 Arial,Helvetica,sans-serif;color:#c9d6e6;">${esc(c.fullName)} wants a bathroom render &amp; free quote · ${esc(formatDate(s.submittedAt, tz))}</div>
  </td></tr>
  <tr><td style="padding:20px 28px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:8px;"><a href="${esc(phoneHref)}" style="display:inline-block;background:${BLUE};color:#fff;text-decoration:none;font:700 13px Arial,Helvetica,sans-serif;padding:10px 16px;border-radius:999px;">Call ${esc(c.phone)}</a></td>
      ${c.email ? '' : '<!--'}<td><a href="mailto:${esc(c.email)}" style="display:inline-block;background:#e7f6f4;color:${TEAL};text-decoration:none;font:700 13px Arial,Helvetica,sans-serif;padding:10px 16px;border-radius:999px;">Email ${esc(c.firstName)}</a></td>${c.email ? '' : '-->'}
    </tr></table>
  </td></tr>
  ${section('Customer Information', customerRows)}
  ${section('Bathroom Vision Board Selections', selectionRows)}
  ${section('Additional Information', extraRows)}
  ${section('Submission Details', metaRows)}
  <tr><td style="padding:24px 28px 26px;font:400 11px/1.6 Arial,Helvetica,sans-serif;color:${MUTED};">
    This notification was sent automatically by the Vision Board form. Reply to this e-mail to respond directly to ${esc(c.fullName)}.
    A JSON copy of the full submission is attached.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function renderText(s, o = {}) {
  const tz = o.timezone || 'America/Denver';
  const c = s.customer;
  const lines = [
    'NEW FORM SUBMISSION – WEBSITE INQUIRY',
    'Caliber Home Solutions – Bath Designer',
    '',
    'CUSTOMER INFORMATION',
    `Customer Name:     ${c.fullName}`,
    `Email Address:     ${c.email || 'Not provided'}`,
    `Phone Number:      ${c.phone}`,
    `City:              ${c.city || 'Not provided'}`,
    `State:             ${c.state || 'Not provided'}`,
    `Form:              ${c.source}`,
    `Zip Code:          ${c.zip}`,
    `Best Time to Call: ${c.bestTime}`,
    `Interested In:     ${c.interests.length ? c.interests.join(', ') : 'Not specified'}`,
    '',
    'BATHROOM VISION BOARD SELECTIONS'
  ];
  s.selections.forEach((sel) => {
    lines.push(`${String(sel.number).padStart(2, ' ')}. ${sel.category}: ${sel.choice}`);
    sel.details.forEach((d) => lines.push(`      ${d.label}: ${d.value}`));
  });
  lines.push(
    '',
    'ADDITIONAL INFORMATION',
    `Board Progress:      ${s.completedCount} of ${s.totalSteps} categories completed`,
    `Starting Style:      ${s.preset}`,
    `Make it Accessible:  ${s.accessible ? 'Yes' : 'No'}`,
    `Shareable Board:     ${s.shareUrl || '—'}`,
    `Contact Consent:     ${s.consent}`,
    '',
    'SUBMISSION DETAILS',
    `Submitted:   ${formatDate(s.submittedAt, tz)}`,
    `UTC:         ${s.submittedAt.toISOString()}`,
    `Reference:   ${s.reference}`,
    `Page:        ${s.meta.pageUrl || '—'}`,
    `IP Address:  ${s.meta.ip || '—'}`,
    `Browser:     ${s.meta.userAgent || '—'}`
  );
  return lines.join('\n');
}

module.exports = { subject, renderHtml, renderText, formatDate, esc };
