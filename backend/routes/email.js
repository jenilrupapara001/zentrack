const express = require('express');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { PartyEmail, EmailLog, GoogleAuth, ReconciliationSession, sequelize } = require('../models');
const { generateEmailBody } = require('../services/emailGenerator');
const gmailSender = require('../services/gmailSender');

// Utility for throttling
const randomDelay = (minMs = 1000, maxMs = 5000) => {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
};

// GET /api/email/logs/daily — get daily email log counts (must be before generic /logs)
router.get('/logs/daily', requireAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Using raw query for MSSQL aggregation compatibility
    const dailyLogs = await sequelize.query('EXEC sp_GetDailyLogSummary @DaysBack = 30', {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({ success: true, data: dailyLogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/email/logs/by-date/:date — get logs for specific date (must be before generic /logs)
router.get('/logs/by-date/:date', requireAuth, async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const logs = await EmailLog.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        }
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/email/logs — get all email logs (must be last among /logs routes)
router.get('/logs', requireAuth, async (req, res) => {
  try {
    const logs = await EmailLog.findAll({
      limit: 100
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/email/verify — verify Gmail connection
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const authRecord = await GoogleAuth.findOne({ where: { isActive: true } });
    if (!authRecord) {
      return res.status(403).json({ success: false, message: 'No Google account connected. Please visit Settings.' });
    }
    res.json({ success: true, message: `Enterprise Dispatcher Active [${authRecord.email}]` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/email/send — send all matched emails via Enterprise Gmail API
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { matchedResults, sessionId: passedSessionId } = req.body;

    const authRecord = await GoogleAuth.findOne({ where: { isActive: true } });
    if (!authRecord) {
      return res.status(400).json({ success: false, message: 'Enterprise Dispatcher offline: No Google account connected.' });
    }

    if (!matchedResults || !Array.isArray(matchedResults) || !matchedResults.length) {
      return res.status(400).json({ success: false, message: 'No matched results to send' });
    }

    const partyEmails = await PartyEmail.findAll({ raw: true });
    const sessionId = passedSessionId || `session_${Date.now()}`;
    const logLines = ['=== Emails Sent Successfully ==='];
    let sentCount = 0;
    let failedCount = 0;
    const results = [];

    for (const entry of matchedResults) {
      const partyCode = entry.partyCode;
      const partyEmailRecord = partyEmails.find(e => e.partyName === partyCode || e.partyCode === partyCode);
      const partyName = partyEmailRecord?.partyName || entry.partyName || partyCode || 'Unknown Party';
      
      let ccEmails = [];
      if (entry.ccEmails && Array.isArray(entry.ccEmails)) {
        ccEmails = entry.ccEmails;
      } else if (partyEmailRecord?.cc) {
        ccEmails = partyEmailRecord.cc.split(',').map(e => e.trim()).filter(Boolean);
      }

      const htmlBody = generateEmailBody(partyCode, entry.payments, entry.debits, partyEmails);

      try {
        const result = await gmailSender.sendMail({
          to: entry.emails,
          cc: ccEmails,
          subject: `Payment Reconciliation for ${partyCode} - ${partyName}`,
          html: htmlBody
        });

        if (result.success) {
          logLines.push(`Party Code: ${partyCode} | Party Name: ${partyName} | Emails: ${entry.emails.join(', ')} | CC: ${ccEmails.join(', ')}`);
          sentCount++;
          results.push({ partyCode, partyName, status: 'sent', emails: entry.emails });

          await EmailLog.create({
            sessionId,
            batchId: sessionId,
            status: 'SENT',
            partyCode,
            partyName,
            emails: entry.emails,
            cc: ccEmails,
            payments: entry.payments,
            debits: entry.debits,
          });
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
        logLines.push(`FAILED: ${partyCode} | Error: ${err.message}`);
        failedCount++;
        results.push({ partyCode, partyName, status: 'failed', error: err.message });

        await EmailLog.create({
          sessionId,
          batchId: sessionId,
          status: 'FAILED',
          partyCode,
          partyName,
          emails: entry.emails,
          cc: ccEmails,
          error: err.message,
          payments: entry.payments,
          debits: entry.debits,
        });
      }

      await randomDelay(1000, 5000);
    }

    logLines.push('\n=== Skipped Parties ===');
    logLines.push('None');

    res.json({
      success: true,
      data: {
        sessionId,
        sentCount,
        failedCount,
        results,
        logLines,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/email/log/download — download latest email log as text
router.get('/log/download', requireAuth, async (req, res) => {
  try {
    const logs = await EmailLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 200
    });

    const lines = ['=== Emails Sent Successfully ==='];
    for (const log of logs.filter(l => l.status === 'SENT')) {
      lines.push(`Party Code: ${log.partyCode} | Party Name: ${log.partyName} | Emails: ${(log.emails || []).join(', ')} | CC: ${(log.cc || []).join(', ')}`);
    }
    lines.push('\n=== Failed ===');
    for (const log of logs.filter(l => l.status === 'FAILED')) {
      lines.push(`FAILED: ${log.partyCode} | Error: ${log.error}`);
    }

    res.setHeader('Content-Disposition', 'attachment; filename=FinalEmailLog.txt');
    res.setHeader('Content-Type', 'text/plain');
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/email/log/excel — download email log as Excel
router.get('/log/excel', requireAuth, async (req, res) => {
  try {
    const logs = await EmailLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 200
    });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Email Log');
    ws.addRow(['Status', 'Party Code', 'Party Name', 'Emails / Error']);

    for (const log of logs) {
      if (log.status === 'SENT') {
        ws.addRow(['SENT', log.partyCode, log.partyName, (log.emails || []).join(', ')]);
      } else if (log.status === 'FAILED') {
        ws.addRow(['FAILED', log.partyCode, log.partyName, log.error]);
      } else {
        ws.addRow(['SKIPPED', log.partyCode, log.partyName, '']);
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    res.setHeader('Content-Disposition', `attachment; filename=FinalEmailLog_${timestamp}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/email/log/no-email/download — download parties without email as CSV
router.get('/log/no-email/download', requireAuth, async (req, res) => {
  try {
    const { partiesWithoutEmail } = req.query;
    if (!partiesWithoutEmail) return res.status(400).json({ success: false, message: 'No data' });

    const data = JSON.parse(decodeURIComponent(partiesWithoutEmail));
    const headers = 'partyCode,partyName,paymentCount\n';
    const rows = data.map(p => `"${p.partyCode}","${p.partyName}",${p.paymentCount}`).join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename=parties_without_email.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(headers + rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/email/log/skip/download — download skip list as CSV
router.get('/log/skip/download', requireAuth, (req, res) => {
  try {
    const { skipLog } = req.query;
    if (!skipLog) return res.status(400).json({ success: false, message: 'No data' });

    const lines = JSON.parse(decodeURIComponent(skipLog));
    const headers = 'Party Code,Skip Reason\n';
    const rows = lines.map(line => {
      if (line.includes(' — ')) {
        const [partyInfo, reason] = line.split(' — ');
        const code = partyInfo.replace('SKIPPED: ', '').trim();
        return `"${code}","${reason}"`;
      }
      return `"","${line}"`;
    }).join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename=skipped_parties.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(headers + rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/email/party/export — export all party emails as CSV
router.get('/party/export', requireAuth, async (req, res) => {
  try {
    const partyEmails = await PartyEmail.findAll({ raw: true });

    const headers = 'partyCode,partyName,email,cc\n';
    const rows = partyEmails.map(p => {
      const email = p.email || '';
      const cc = p.cc || '';
      return `"${p.partyCode || ''}","${p.partyName || ''}","${email.replace(/"/g, '""')}","${cc.replace(/"/g, '""')}"`;
    }).join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename=party_emails.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(headers + rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/email/retry — retry failed emails
router.post('/retry', requireAuth, async (req, res) => {
  try {
    const { logIds } = req.body;

    if (!logIds || !Array.isArray(logIds) || !logIds.length) {
      return res.status(400).json({ success: false, message: 'No failed log IDs provided' });
    }

    const authRecord = await GoogleAuth.findOne({ where: { isActive: true } });
    if (!authRecord) {
      return res.status(400).json({ success: false, message: 'Enterprise Dispatcher offline: No Google account connected.' });
    }

    const partyEmails = await PartyEmail.findAll({ raw: true });
    const failedLogs = await EmailLog.findAll({ 
      where: { 
        id: { [Op.in]: logIds }, 
        status: 'FAILED' 
      } 
    });

    if (!failedLogs.length) {
      return res.status(400).json({ success: false, message: 'No failed emails found to retry' });
    }

    let sentCount = 0;
    let failedCount = 0;
    const results = [];

    for (const log of failedLogs) {
      const partyCode = log.partyCode;
      const partyEmailRecord = partyEmails.find(e => e.partyCode === partyCode || e.partyName === partyCode);
      const partyName = partyEmailRecord?.partyName || log.partyName || partyCode || 'Unknown Party';

      const freshToEmails = partyEmailRecord?.email ? partyEmailRecord.email.split(',').map(e => e.trim()).filter(Boolean) : (log.emails || []);
      const freshCcEmails = partyEmailRecord?.cc ? partyEmailRecord.cc.split(',').map(e => e.trim()).filter(Boolean) : (log.cc || []);

      let payments = log.payments && log.payments.length > 0 ? log.payments : [];
      let debits = log.debits && log.debits.length > 0 ? log.debits : [];
      
      if (payments.length === 0 && partyCode) {
        const session = await ReconciliationSession.findOne({ order: [['createdAt', 'DESC']] });
        if (session && session.matchedResults) {
          const partyData = session.matchedResults.find(m => m.partyCode === partyCode || m.partyName === partyCode);
          if (partyData) {
            payments = partyData.payments || [];
            debits = partyData.debits || [];
          }
        }
      }

      const htmlBody = generateEmailBody(partyCode, payments, debits, partyEmails);

      try {
        const result = await gmailSender.sendMail({
          to: freshToEmails,
          cc: freshCcEmails,
          subject: `Payment Reconciliation for ${partyCode} - ${partyName}`,
          html: htmlBody
        });

        if (result.success) {
          await log.update({ status: 'SENT', error: '', emails: freshToEmails, cc: freshCcEmails });
          sentCount++;
          results.push({ partyCode, partyName, status: 'sent', logId: log.id });
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
        failedCount++;
        results.push({ partyCode, partyName, status: 'failed', error: err.message, logId: log.id });
      }

      await randomDelay(1000, 5000);
    }

    res.json({
      success: true,
      data: {
        sentCount,
        failedCount,
        results,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
