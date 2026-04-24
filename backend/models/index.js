const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Helper for JSON columns in MSSQL (v6 doesn't always map JSON to TEXT automatically for all MSSQL versions)
const jsonColumn = (fieldName) => ({
  type: DataTypes.TEXT,
  get() {
    const value = this.getDataValue(fieldName);
    if (!value) return [];
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return [value];
    }
  },
  set(value) {
    this.setDataValue(fieldName, value ? JSON.stringify(value) : null);
  },
});

// ─── Party Email Model ─────────────────────────────────────────────────────────
const PartyEmail = sequelize.define('PartyEmail', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  partyCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  partyName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cc: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['partyName'] },
    { fields: ['partyCode'] },
  ],
});

// ─── Reconciliation Session Model ─────────────────────────────────────────────
const ReconciliationSession = sequelize.define('ReconciliationSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  filename: {
    type: DataTypes.STRING,
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  matchedResults: jsonColumn('matchedResults'),
  skipLogLines: jsonColumn('skipLogLines'),
  partiesWithoutEmail: jsonColumn('partiesWithoutEmail'),
  summary: jsonColumn('summary'),
  status: {
    type: DataTypes.ENUM('pending', 'processed', 'emailed'),
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
});

// ─── Email Log Model ───────────────────────────────────────────────────────────
const EmailLog = sequelize.define('EmailLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('SENT', 'FAILED', 'SKIPPED'),
    allowNull: false,
  },
  partyCode: {
    type: DataTypes.STRING,
  },
  partyName: {
    type: DataTypes.STRING,
  },
  emails: jsonColumn('emails'),
  cc: jsonColumn('cc'),
  error: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  payments: jsonColumn('payments'),
  debits: jsonColumn('debits'),
}, {
  timestamps: true,
});

// Associations
EmailLog.belongsTo(ReconciliationSession, { as: 'batch', foreignKey: 'batchId' });
ReconciliationSession.hasMany(EmailLog, { as: 'emailLogs', foreignKey: 'batchId' });

// ─── Google Auth Model ─────────────────────────────────────────────────────────
const GoogleAuth = sequelize.define('GoogleAuth', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

module.exports = { PartyEmail, EmailLog, ReconciliationSession, GoogleAuth, sequelize };
