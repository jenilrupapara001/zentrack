require('dotenv').config();
const mongoose = require('mongoose');
const { PartyEmail, EmailLog, ReconciliationSession, GoogleAuth, sequelize } = require('./models');

// MongoDB URI (from .env)
const MONGO_URI = process.env.MONGODB_URI;

// ─── MongoDB Schemas (Minimal for migration) ──────────────────────────────────
const mongoPartyEmail = mongoose.model('OldPartyEmail', new mongoose.Schema({
  partyCode: String,
  partyName: String,
  email: String,
  cc: String,
}, { timestamps: true }), 'partyemails');

const mongoEmailLog = mongoose.model('OldEmailLog', new mongoose.Schema({
  sessionId: String,
  status: String,
  partyCode: String,
  partyName: String,
  emails: [String],
  cc: [String],
  error: String,
  sentAt: Date,
  batchId: mongoose.Schema.Types.ObjectId,
  payments: mongoose.Schema.Types.Mixed,
  debits: mongoose.Schema.Types.Mixed,
}, { timestamps: true }), 'emaillogs');

const mongoSession = mongoose.model('OldSession', new mongoose.Schema({
  filename: String,
  uploadedAt: Date,
  matchedResults: mongoose.Schema.Types.Mixed,
  skipLogLines: [String],
  partiesWithoutEmail: mongoose.Schema.Types.Mixed,
  summary: mongoose.Schema.Types.Mixed,
  status: String,
}, { timestamps: true }), 'reconciliationsessions');

const mongoGoogleAuth = mongoose.model('OldGoogleAuth', new mongoose.Schema({
  email: String,
  refreshToken: String,
  isActive: Boolean,
}, { timestamps: true }), 'googleauths');

async function migrate() {
  try {
    console.log('🚀 Starting Data Migration: MongoDB -> SQL Server');

    // 1. Connect to both databases
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    await sequelize.authenticate();
    await sequelize.sync(); // Ensure tables exist
    console.log('✅ Connected to SQL Server');

    // 2. Migrate Party Emails
    console.log('📦 Migrating PartyEmail...');
    const oldPartyEmails = await mongoPartyEmail.find({}).lean();
    for (const p of oldPartyEmails) {
      await PartyEmail.upsert({
        partyCode: p.partyCode,
        partyName: p.partyName,
        email: p.email,
        cc: p.cc,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      });
    }
    console.log(`✅ Migrated ${oldPartyEmails.length} Party Emails`);

    // 3. Migrate Google Auth
    console.log('📦 Migrating GoogleAuth...');
    const oldAuths = await mongoGoogleAuth.find({}).lean();
    for (const a of oldAuths) {
      await GoogleAuth.upsert({
        email: a.email,
        refreshToken: a.refreshToken,
        isActive: a.isActive,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      });
    }
    console.log(`✅ Migrated ${oldAuths.length} Google Auth records`);

    // 4. Migrate Reconciliation Sessions
    console.log('📦 Migrating ReconciliationSession...');
    const oldSessions = await mongoSession.find({}).lean();
    const sessionMap = {}; // To handle relationships
    for (const s of oldSessions) {
      const newSession = await ReconciliationSession.create({
        filename: s.filename,
        uploadedAt: s.uploadedAt,
        matchedResults: s.matchedResults,
        skipLogLines: s.skipLogLines,
        partiesWithoutEmail: s.partiesWithoutEmail,
        summary: s.summary,
        status: s.status,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      });
      sessionMap[s._id.toString()] = newSession.id;
    }
    console.log(`✅ Migrated ${oldSessions.length} Sessions`);

    // 5. Migrate Email Logs
    console.log('📦 Migrating EmailLog...');
    const oldLogs = await mongoEmailLog.find({}).lean();
    for (const l of oldLogs) {
      await EmailLog.create({
        sessionId: l.sessionId,
        status: l.status,
        partyCode: l.partyCode,
        partyName: l.partyName,
        emails: l.emails,
        cc: l.cc,
        error: l.error,
        sentAt: l.sentAt,
        batchId: l.batchId ? sessionMap[l.batchId.toString()] : null,
        payments: l.payments,
        debits: l.debits,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt
      });
    }
    console.log(`✅ Migrated ${oldLogs.length} Email Logs`);

    console.log('✨ Migration Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Failed:', err);
    process.exit(1);
  }
}

migrate();
