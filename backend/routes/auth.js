const express = require('express');
const crypto = require('crypto');
const router = express.Router();

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

module.exports = router;
