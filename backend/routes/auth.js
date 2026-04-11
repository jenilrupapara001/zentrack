const express = require('express');
const crypto = require('crypto');
const { google } = require('googleapis');
const router = express.Router();

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
    scope: ['https://www.googleapis.com/auth/gmail.send'],
    prompt: 'consent', // Force to get refresh token
  });
  res.redirect(url);
});

// GET /api/auth/google/callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (tokens.refresh_token) {
      console.log('✅ REFRESH TOKEN CAPTURED:', tokens.refresh_token);
      console.log('----------------------------------------------------');
      console.log('Action Required: Add the following to your .env file:');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('----------------------------------------------------');
      
      // We also store it in the session temporarily so the frontend can display a success message
      req.session.gmail_connected = true;
    }

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #10b981;">Gmail Connected Successfully!</h1>
        <p>You can now close this window and refresh the dashboard.</p>
        ${!tokens.refresh_token ? '<p style="color: #f59e0b;">Warning: Refresh token not received. If this is a reconnect, you may need to revoke access in Google Account settings first.</p>' : ''}
      </div>
    `);
  } catch (err) {
    console.error('Error exchanging code for tokens:', err.message);
    res.status(500).send('Authentication failed');
  }
});

module.exports = router;
