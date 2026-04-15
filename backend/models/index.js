const mongoose = require('mongoose');

// ─── Party Email Model ─────────────────────────────────────────────────────────
const partyEmailSchema = new mongoose.Schema({
  partyCode: { type: String, default: '' },
  partyName: { type: String, required: true, trim: true },
  email: { type: String, default: '' },
  cc: { type: String, default: '' },
}, { timestamps: true });

partyEmailSchema.index({ partyName: 1 });
partyEmailSchema.index({ partyCode: 1 });

const PartyEmail = mongoose.model('PartyEmail', partyEmailSchema);

// ─── Email Log Model ───────────────────────────────────────────────────────────
const emailLogSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  status: { type: String, enum: ['SENT', 'FAILED', 'SKIPPED'], required: true },
  partyCode: { type: String, default: '' },
  partyName: { type: String, default: '' },
  emails: { type: [String], default: [] },
  cc: { type: [String], default: [] },
  error: { type: String, default: '' },
  sentAt: { type: Date, default: Date.now },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReconciliationSession' },
  payments: { type: mongoose.Schema.Types.Mixed, default: null },
  debits: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

// ─── Reconciliation Session Model ─────────────────────────────────────────────
const reconciliationSessionSchema = new mongoose.Schema({
  filename: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  matchedResults: { type: mongoose.Schema.Types.Mixed, default: [] },
  skipLogLines: { type: [String], default: [] },
  partiesWithoutEmail: { type: mongoose.Schema.Types.Mixed, default: [] },
  summary: {
    matched: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    withoutEmail: { type: Number, default: 0 }
  },
  status: { type: String, enum: ['pending', 'processed', 'emailed'], default: 'pending' },
}, { timestamps: true });

const ReconciliationSession = mongoose.model('ReconciliationSession', reconciliationSessionSchema);

// ─── Google Auth Model ─────────────────────────────────────────────────────────
const googleAuthSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  refreshToken: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const GoogleAuth = mongoose.model('GoogleAuth', googleAuthSchema);

module.exports = { PartyEmail, EmailLog, ReconciliationSession, GoogleAuth };
