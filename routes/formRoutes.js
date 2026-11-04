'use strict';

const express = require('express');
const { submitFormRules, handleValidation } = require('../middleware/validation');
const { submitLimiter, spamGuard } = require('../middleware/spamProtection');
const { submitForm } = require('../controllers/formController');
const { getEmailSettings, validateEmailSettings } = require('../config/emailConfig');

const router = express.Router();

router.post('/submit-form', submitLimiter, spamGuard, submitFormRules, handleValidation, submitForm);

router.get('/health', (req, res) => {
  const problems = validateEmailSettings(getEmailSettings());
  res.status(problems.length ? 503 : 200).json({ ok: !problems.length, email: problems.length ? 'not configured' : 'configured' });
});

module.exports = router;
