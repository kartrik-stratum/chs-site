'use strict';

const logger = require('../utils/logger');

function notFound(req, res) {
  if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, message: 'Not found.' });
  return res.status(404).sendFile('404.html', { root: require('path').join(__dirname, '..', 'public') }, (err) => {
    if (err) res.status(404).send('Not found');
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ ok: false, message: 'Invalid request body.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ ok: false, message: 'Request is too large.' });
  logger.error('unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ ok: false, message: 'Something went wrong on our end. Please try again or call (970) 361-3404.' });
}

module.exports = { notFound, errorHandler };
