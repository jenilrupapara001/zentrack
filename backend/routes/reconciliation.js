const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { PartyEmail, ReconciliationSession } = require('../models');
const { loadExcel, matchData, validateDates } = require('../services/excelParser');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/reconciliation/upload — upload and parse payment Excel
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { syncToDatabase } = req.body;

    const { paymentDf, debitDf } = loadExcel(req.file.buffer);
    validateDates(paymentDf);

    const partyEmails = await PartyEmail.find({}).lean();
    const normalizedEmails = partyEmails.map(e => ({
      partyCode: e.partyCode,
      partyName: e.partyName,
      email: e.email,
      cc: e.cc,
    }));

    const { result: matchedResults, skipLogLines, partiesWithoutEmail } = matchData(paymentDf, debitDf, normalizedEmails);

    // AI Sync Logic: If syncToDatabase is true, update the PartyEmail collection with any newly found mappings
    if (syncToDatabase === 'true' || syncToDatabase === true) {
      for (const entry of matchedResults) {
        if (entry.partyCode && entry.emails.length > 0) {
          await PartyEmail.findOneAndUpdate(
            { partyCode: entry.partyCode },
            { 
              partyName: entry.partyName,
              email: entry.emails[0], // Use the first email found
            },
            { upsert: true }
          );
        }
      }
    }

    // Persist to Database Session
    const session = await ReconciliationSession.create({
      filename: req.file.originalname,
      matchedResults,
      skipLogLines,
      partiesWithoutEmail,
      summary: {
        matched: matchedResults.length,
        skipped: skipLogLines.length,
        withoutEmail: partiesWithoutEmail.length,
      },
      status: 'processed'
    });

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        matchedResults,
        skipLogLines,
        partiesWithoutEmail,
        summary: session.summary,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reconciliation/session/:id — get specific session data
router.get('/session/:id', requireAuth, async (req, res) => {
  try {
    const session = await ReconciliationSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reconciliation/session — get latest session data
router.get('/session', requireAuth, async (req, res) => {
  try {
    const session = await ReconciliationSession.findOne({}).sort({ createdAt: -1 });
    if (!session) return res.json({ success: true, data: null });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reconciliation/sample — download sample payment Excel
router.get('/sample', requireAuth, (req, res) => {
  const wb = XLSX.utils.book_new();

  const paymentData = [
    {
      'Party Name': 'Alpha Corp',
      'Inv. No.': 'INV001',
      'Pur. Date': '2025-01-10',
      'Total Inv. Amount': 10000,
      'Debit Amount': 1000,
      'Net Amount': 9500,
      'Bank Payment': 9500,
      'Payment Date': '2025-02-10',
      'Amount': 9500,
    },
    {
      'Party Name': 'Beta Ltd',
      'Inv. No.': 'INV002',
      'Pur. Date': '2025-01-15',
      'Total Inv. Amount': 20000,
      'Debit Amount': '',
      'Net Amount': 20000,
      'Bank Payment': 20000,
      'Payment Date': '2025-02-20',
      'Amount': 20000,
    },
  ];

  const debitData = [
    {
      'Party Name': 'Alpha Corp',
      'Date': '2025-02-05',
      'Return Invoice No.': 'DN001',
      'Amount': 500,
    },
  ];

  const wsPayment = XLSX.utils.json_to_sheet(paymentData);
  const wsDebit = XLSX.utils.json_to_sheet(debitData);
  XLSX.utils.book_append_sheet(wb, wsPayment, 'Payment Details');
  XLSX.utils.book_append_sheet(wb, wsDebit, 'Debit Notes');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=SampleInvoices.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// GET /api/reconciliation/download/partywise — download all party-wise sheets in one Excel
router.get('/download/partywise', requireAuth, async (req, res) => {
  try {
    if (!currentSession || !currentSession.matchedResults.length) {
      return res.status(400).json({ success: false, message: 'No reconciliation data available. Please upload and process first.' });
    }

    const workbook = new ExcelJS.Workbook();
    for (const party of currentSession.matchedResults) {
      const partyCode = String(party.partyCode).substring(0, 28);

      // Payment sheet
      const paySheet = workbook.addWorksheet(`${partyCode}_Pay`);
      if (party.payments.length) {
        const headers = Object.keys(party.payments[0]);
        paySheet.addRow(headers);
        for (const row of party.payments) {
          paySheet.addRow(headers.map(h => row[h] ?? ''));
        }
      }

      // Debit sheet
      if (party.debits && party.debits.length) {
        const debitSheet = workbook.addWorksheet(`${partyCode}_Debit`);
        const dHeaders = Object.keys(party.debits[0]);
        debitSheet.addRow(dHeaders);
        for (const row of party.debits) {
          debitSheet.addRow(dHeaders.map(h => row[h] ?? ''));
        }
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `All_Partywise_Payments_${timestamp}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
