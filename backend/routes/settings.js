const express = require('express');
const router = express.Router();
const { SmtpCredential, GoogleAuth } = require('../models');
const { requireAuth } = require('../middleware/auth');

// ─── SMTP Settings ───────────────────────────────────────────────────────────

// GET /api/settings/smtp — list all SMTP credentials
router.get('/smtp', requireAuth, async (req, res) => {
  try {
    const creds = await SmtpCredential.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: creds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/settings/smtp — add a new SMTP credential
router.post('/smtp', requireAuth, async (req, res) => {
  try {
    const { label, user, pass, host, port, secure } = req.body;
    const cred = await SmtpCredential.create({ label, user, pass, host, port, secure });
    res.status(201).json({ success: true, data: cred });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/settings/smtp/:id — delete a credential
router.delete('/smtp/:id', requireAuth, async (req, res) => {
  try {
    await SmtpCredential.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Credential deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Gmail settings ─────────────────────────────────────────────────────────

// GET /api/settings/gmail — Get connected gmail status
router.get('/gmail', requireAuth, async (req, res) => {
  try {
    const googleAuth = await GoogleAuth.findOne({ isActive: true });
    res.json({ 
      success: true, 
      connected: !!googleAuth,
      email: googleAuth ? googleAuth.email : null 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/settings/gmail — Disconnect gmail account
router.delete('/gmail', requireAuth, async (req, res) => {
  try {
    await GoogleAuth.deleteMany({}); // Clear all connections
    res.json({ success: true, message: 'Gmail account disconnected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
