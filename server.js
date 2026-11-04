/**
 * Caliber Home Solutions – Express server.
 *   npm start           -> http://localhost:3000
 */
'use strict';

require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const formRoutes = require('./routes/formRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { getEmailSettings, validateEmailSettings, getTransporter } = require('./config/emailConfig');
const logger = require('./utils/logger');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        styleSrcAttr: ["'unsafe-inline'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: null
      }
    }
  }));

  app.use('/api', express.json({ limit: '32kb' }));
  app.use('/api', formRoutes);

  // The catalog is shared with the backend; serve it to the browser from one source.
  app.get('/js/catalog.js', (req, res) => res.type('application/javascript').sendFile(path.join(__dirname, 'shared', 'catalog.js')));

  app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html'],
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    setHeaders(res, file) { if (file.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); }
  }));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

function start() {
  const port = parseInt(process.env.PORT || '3000', 10);
  const app = createApp();
  const server = app.listen(port, () => {
    logger.info(`Vision Board running at http://localhost:${port}`);
    const settings = getEmailSettings();
    const problems = validateEmailSettings(settings);
    if (problems.length) {
      logger.warn('E-mail notifications are NOT configured - submissions will fail until .env is completed', { problems });
    } else {
      getTransporter(settings).verify()
        .then(() => logger.info('SMTP connection verified', { host: settings.host, port: settings.port }))
        .catch((err) => logger.warn('SMTP verification failed - check your SMTP settings', { error: err.message }));
    }
  });
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  return server;
}

if (require.main === module) start();

module.exports = { createApp, start };
