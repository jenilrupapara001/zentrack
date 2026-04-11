require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const partyEmailRoutes = require('./routes/partyEmails');
const reconciliationRoutes = require('./routes/reconciliation');
const emailRoutes = require('./routes/email');
const settingsRoutes = require('./routes/settings');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5002;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payment_reconciliation')
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const isProduction = process.env.NODE_ENV === 'production';

// Aggressive Trust Proxy for Render/Vercel Handshake
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://zentrack-alpha.vercel.app',
  credentials: true,
}));

// Diagnostic startup log
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'} | Client: ${process.env.CLIENT_URL}`);

// Diagnostic Handshake Monitor
app.use((req, res, next) => {
  if (isProduction || req.headers['x-forwarded-proto'] === 'https') {
    console.log(`📡 [Handshake] ${req.method} ${req.path} | Origin: ${req.headers.origin} | SID: ${req.sessionID ? req.sessionID.substring(0, 5) : 'Missing'}...`);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'zentrack-enterprise-vault-secret',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  name: 'zentrack.sid', // Custom cookie name to avoid collisions
  cookie: { 
    secure: true, // Force secure for cross-site compatibility
    httpOnly: true, 
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    sameSite: 'none', // Force none for Vercel -> Render handshake
  },
}));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/party-emails', partyEmailRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
