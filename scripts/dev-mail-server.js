#!/usr/bin/env node
/**
 * Local SMTP "mail catcher" for development and testing.
 *   npm run mail:dev            (listens on 127.0.0.1:1025)
 * Every e-mail the app sends is saved to ./dev-mail/ as .eml + .html so you
 * can open it in a browser and verify exactly what the owner receives.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');

const PORT = parseInt(process.env.DEV_SMTP_PORT || '1025', 10);
const OUT = path.join(__dirname, '..', 'dev-mail');
fs.mkdirSync(OUT, { recursive: true });

const server = new SMTPServer({
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  logger: false,
  onAuth(auth, session, cb) { cb(null, { user: auth.username || 'dev' }); },
  onData(stream, session, cb) {
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', async () => {
      const raw = Buffer.concat(chunks);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const base = path.join(OUT, stamp);
      fs.writeFileSync(base + '.eml', raw);
      try {
        const mail = await simpleParser(raw);
        let html = mail.html || `<pre>${mail.text || ''}</pre>`;
        // inline cid: images so the saved .html renders like a mail client
        (mail.attachments || []).forEach((a) => {
          if (a.cid) html = html.split(`cid:${a.cid}`).join(`data:${a.contentType};base64,${a.content.toString('base64')}`);
        });
        fs.writeFileSync(base + '.html', html);
        console.log(`\n✉  ${mail.subject}\n   to: ${mail.to && mail.to.text}  reply-to: ${mail.replyTo && mail.replyTo.text}\n   attachments: ${(mail.attachments || []).length}\n   saved: ${base}.html`);
      } catch (err) {
        console.error('parse failed', err);
      }
      cb();
    });
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`Dev mail catcher listening on smtp://127.0.0.1:${PORT} – saving to ${OUT}`));
