const express = require('express');
const router = express.Router();
const { GoogleAuth } = require('../models');
const { requireAuth } = require('../middleware/auth');

/**
 * ENTERPRISE SETTINGS HUB
 * -----------------------
 * Exclusively manages high-priority Google Cloud (Gmail API) infrastructure.
 */

// GET /api/settings/gmail — Get connected gmail status
router.get('/gmail', requireAuth, async (req, res) => {
  try {
    const googleAuth = await GoogleAuth.findOne({ where: { isActive: true } });
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
    await GoogleAuth.destroy({ where: {} }); // Clear all connections
    res.json({ success: true, message: 'Google Enterprise Account Disconnected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
