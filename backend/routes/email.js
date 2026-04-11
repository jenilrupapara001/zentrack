const express = require('express');
const ExcelJS = require('exceljs');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { PartyEmail, EmailLog, SmtpCredential } = require('../models');
const { generateEmailBody } = require('../services/emailGenerator');
const { sendEmailWithRetry, randomDelay } = require('../services/smtpSender');

// GET /api/email/logs — get all email logs
router.get('/logs', requireAuth, async (req, res) => {
  try {
    const logs = await EmailLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/email/send — send all matched emails
router.post('/send', requireAuth, async (req, res) => {
  try {
    let { gmailUser, gmailPassword, smtpId, matchedResults } = req.body;

    // If smtpId is provided, fetch credentials from database
    if (smtpId && (!gmailUser || !gmailPassword)) {
      const cred = await SmtpCredential.findById(smtpId);
      if (cred) {
        gmailUser = cred.user;
        gmailPassword = cred.pass;
      }
    }

    if (!gmailUser || !gmailPassword) {
      return res.status(400).json({ success: false, message: 'Gmail credentials required' });
    }
    if (!matchedResults || !Array.isArray(matchedResults) || !matchedResults.length) {
      return res.status(400).json({ success: false, message: 'No matched results to send' });
    }

    const partyEmails = await PartyEmail.find({}).lean();
    const sessionId = `session_${Date.now()}`;
    const logLines = ['=== Emails Sent Successfully ==='];
    let sentCount = 0;
    let failedCount = 0;
    const results = [];

    for (const entry of matchedResults) {
      const partyCode = entry.partyCode;
      const partyEmailRecord = partyEmails.find(e => e.partyName === partyCode);
      const partyName = partyEmailRecord?.partyName || partyCode || 'Unknown Party';
      const ccStr = partyEmailRecord?.cc || '';
      const ccEmails = ccStr ? ccStr.split(',').map(e => e.trim()).filter(Boolean) : [];

      const htmlBody = generateEmailBody(partyCode, entry.payments, entry.debits, partyEmails);

      try {
        const result = await sendEmailWithRetry(
          gmailUser,
          gmailPassword,
          entry.emails,
          `Payment Reconciliation for ${partyCode} - ${partyName}`,
          htmlBody,
          ccEmails
        );

        if (result.success) {
          logLines.push(`Party Code: ${partyCode} | Party Name: ${partyName} | Emails: ${entry.emails.join(', ')} | CC: ${ccEmails.join(', ')}`);
          sentCount++;
          results.push({ partyCode, partyName, status: 'sent', emails: entry.emails });

          await EmailLog.create({
            sessionId,
            status: 'SENT',
            partyCode,
            partyName,
            emails: entry.emails,
            cc: ccEmails,
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
          status: 'FAILED',
          partyCode,
          partyName,
          emails: entry.emails,
          error: err.message,
        });
      }

      // Random delay 1-5 seconds — mirrors Python time.sleep(random.uniform(1,5))
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
    const logs = await EmailLog.find({}).sort({ createdAt: -1 }).limit(200).lean();

    const lines = ['=== Emails Sent Successfully ==='];
    for (const log of logs.filter(l => l.status === 'SENT')) {
      lines.push(`Party Code: ${log.partyCode} | Party Name: ${log.partyName} | Emails: ${log.emails.join(', ')} | CC: ${log.cc.join(', ')}`);
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
    const logs = await EmailLog.find({}).sort({ createdAt: -1 }).limit(200).lean();

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Email Log');
    ws.addRow(['Status', 'Party Code', 'Party Name', 'Emails / Error']);

    for (const log of logs) {
      if (log.status === 'SENT') {
        ws.addRow(['SENT', log.partyCode, log.partyName, log.emails.join(', ')]);
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

module.exports = router;
