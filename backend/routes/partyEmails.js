const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { PartyEmail, sequelize } = require('../models');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// GET /api/party-emails — list all
router.get('/', requireAuth, async (req, res) => {
  try {
    const emails = await PartyEmail.findAll({ raw: true });
    res.json({ success: true, data: emails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/party-emails/upload — bulk upload via Excel (password protected)
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rows.length) return res.status(400).json({ success: false, message: 'Excel file is empty' });

    const firstRow = rows[0];
    const hasRequiredCols = 'Party Code' in firstRow && 'Email' in firstRow;
    if (!hasRequiredCols) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Excel must contain 'Party Code', 'Party Name', and 'Email' columns" });
    }

    const missingEmails = [];
    for (const row of rows) {
      const partyCode = String(row['Party Code'] || '').trim();
      const partyName = String(row['Party Name'] || '').trim();
      const email = String(row['Email'] || '').trim();
      const cc = String(row['CC'] || '').trim();

      if (!email || email.toLowerCase() === 'nan' || email.toLowerCase() === 'none') {
        missingEmails.push(`${partyName} (${partyCode})`);
      }

      // Check if a record exists with BOTH partyCode and partyName
      const existing = await PartyEmail.findOne({
        where: { partyCode, partyName },
        transaction
      });

      if (existing) {
        await existing.update({ email, cc }, { transaction });
      } else {
        await PartyEmail.create({ partyCode, partyName, email, cc }, { transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: `Updated ${rows.length} party email records`,
      missingEmails,
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/party-emails/:id — update single party email (password protected)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { partyCode, partyName, email, cc } = req.body;
    const [updatedCount] = await PartyEmail.update(
      { partyCode, partyName, email, cc },
      { where: { id: req.params.id } }
    );
    
    if (updatedCount === 0) return res.status(404).json({ success: false, message: 'Party not found' });
    
    const updated = await PartyEmail.findByPk(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/party-emails/sample — download sample email Excel
router.get('/sample', requireAuth, (req, res) => {
  const wb = XLSX.utils.book_new();
  const data = [
    { 'Party Code': 'PC123', 'Party Name': 'ABC Traders', 'Email': 'abc@example.com,bcd@gmail.com', 'CC': '' },
    { 'Party Code': 'PC456', 'Party Name': 'XYZ Pvt Ltd', 'Email': 'xyz@example.com', 'CC': '' },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Party Emails');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=SampleMail.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

module.exports = router;
