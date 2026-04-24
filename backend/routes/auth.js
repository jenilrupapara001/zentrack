const express = require('express');
const crypto = require('crypto');
const { google } = require('googleapis');
const router = express.Router();
const { GoogleAuth } = require('../models');

const isProduction = process.env.NODE_ENV === 'production';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Password';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  const isValidUser = username === ADMIN_USERNAME;
  const isValidPass = hashPassword(password) === hashPassword(ADMIN_PASSWORD);

  if (isValidUser && isValidPass) {
    req.session.authenticated = true;
    return res.json({ success: true, message: 'Authenticated successfully' });
  }
  
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/status
router.get('/status', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// ─── Google OAuth (Gmail API) ────────────────────────────────────────────────

// GET /api/auth/google
router.get('/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    prompt: 'consent', // Force to get refresh token
  });
  res.redirect(url);
});

// GET /api/auth/google/callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (tokens.refresh_token) {
      const [record, created] = await GoogleAuth.findOrCreate({
        where: { email },
        defaults: { refreshToken: tokens.refresh_token, isActive: true }
      });
      
      if (!created) {
        await record.update({ refreshToken: tokens.refresh_token, isActive: true });
      }
      
      console.log(`✅ DISPATCH HUB: Gmail authorized for ${email}`);
    } else {
      // If we didn't get a refresh token, check if we already have one
      const existing = await GoogleAuth.findOne({ where: { email } });
      if (!existing) {
        throw new Error('No refresh token received. Revoke access and try again.');
      }
    }

    req.session.gmail_connected = email;

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 100px 20px; background: #f8fafc; min-height: 100vh;">
        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <div style="color: #10b981; font-size: 48px; margin-bottom: 20px;">✓</div>
          <h1 style="color: #0f172a; margin-bottom: 16px;">Gmail Connected!</h1>
          <p style="color: #64748b; margin-bottom: 32px; line-height: 1.6;">Your identity has been verified. ZenTrack is now authorized to send high-volume reconciliation emails from your account.</p>
          
          ${!tokens.refresh_token ? `
            <div style="background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 16px; border-radius: 12px; margin-bottom: 32px; font-size: 14px; text-align: left;">
              <strong>Note:</strong> Refresh token not received. If this is a reconnect, you may need to revoke access in your Google Account settings first.
            </div>
          ` : ''}

          <div style="display: flex; gap: 12px; justify-content: center;">
            <button onclick="window.close()" style="background: #0f172a; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer;">Close This Window</button>
            <a href="${process.env.CLIENT_URL}" style="text-decoration: none; background: #2563eb; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold;">Go to Dashboard</a>
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    console.error('Error exchanging code for tokens:', err.message);
    res.status(500).send('Authentication failed');
  }
});

module.exports = router;
