/**
 * Excel parsing service — exact port of Python load_excel() logic
 */
const XLSX = require('xlsx');

function safeNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function parseExcelDate(val) {
  if (val === null || val === undefined || val === '') return null;
  try {
    let date;
    if (typeof val === 'number') {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        // SSF dates are 1-indexed for month
        date = new Date(parsed.y, parsed.m - 1, parsed.d);
      }
    } else {
      date = new Date(val);
    }

    if (!date || isNaN(date.getTime()) || date.getFullYear() < 1980) return null;
    return date;
  } catch {
    return null;
  }
}

function safeDateFormat(val) {
  const date = parseExcelDate(val);
  if (!date) return val ? String(val) : '';
  const d = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${mo}/${date.getFullYear()}`;
}

function deriveCode(val) {
  if (!val) return '';
  const m = val.trim().match(/^(\d+)/);
  if (m) return m[1];
  return val.includes('-') ? val.split('-')[0].trim() : val.trim();
}

function normalizeName(name) {
  if (!name) return '';
  return String(name).replace(/\s+/g, '').trim().toLowerCase();
}

function pick(colMap, candidates) {
  for (const cand of candidates) {
    if (colMap[cand.toLowerCase()]) return colMap[cand.toLowerCase()];
  }
  return null;
}

/**
 * Parse uploaded Excel buffer.
 * Returns { paymentDf: Array, debitDf: Array }
 * Mirrors Python load_excel() exactly including legacy two-sheet format support.
 */
function loadExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetNames = workbook.SheetNames.map(s => s.trim());

  // ── Legacy two-sheet format ───────────────────────────────────────────────
  if (sheetNames.includes('Payment Details') && sheetNames.includes('Debit Notes')) {
    const rawPayment = XLSX.utils.sheet_to_json(workbook.Sheets['Payment Details'], { defval: '' });
    const rawDebit = XLSX.utils.sheet_to_json(workbook.Sheets['Debit Notes'], { defval: '' });

    const normalizeRows = (rows, type) => rows.map(row => {
      const colMap = {};
      Object.keys(row).forEach(col => { colMap[col.trim().toLowerCase()] = col; });

      const colSeller = pick(colMap, ['Seller Name', 'Party Name', 'Party']);
      const colAmt = pick(colMap, ['Amount', 'Net Amount', 'Bank Payment']);
      const colDR = pick(colMap, ['DR', 'Debit', 'Debit Amount']);
      const colBill = pick(colMap, ['Bill No', 'Invoice No', 'Inv. No.']);
      const colDate = pick(colMap, ['Invoice Date', 'Date', 'Pur. Date']);

      const sellerVal = String(row[colSeller] || '').trim();
      const partyCode = deriveCode(sellerVal) || sellerVal;

      if (type === 'payment') {
        return {
          'Party Name': sellerVal,
          'Party Code': partyCode,
          'Inv. No.': String(row[colBill] || ''),
          'Pur. Date': row[colDate] || '',
          'Debit Amount': colDR ? safeNum(row[colDR]) : 0,
          'Bank Payment': colAmt ? safeNum(row[colAmt]) : 0,
          'Transaction Type': 'Payment',
        };
      } else {
        return {
          'Party Name': sellerVal,
          'Party Code': partyCode,
          'Date': row[colDate] || '',
          'Return Invoice No.': String(row[colBill] || ''),
          'Amount': colAmt ? safeNum(row[colAmt]) : 0,
        };
      }
    });

    return {
      paymentDf: normalizeRows(rawPayment, 'payment'),
      debitDf: normalizeRows(rawDebit, 'debit')
    };
  }

  // ── New single-sheet format ───────────────────────────────────────────────
  const sheetName = sheetNames[0];
  const ws = workbook.Sheets[sheetName];

  // Detect merged summary rows (header might be at row index 2)
  const rawPreview = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', range: 0 });
  let headerRow = 0;
  if (rawPreview.length > 0) {
    const firstCell = String(rawPreview[0][0] || '');
    if (firstCell.includes('Seller Name:') && firstCell.includes('Advised No')) {
      headerRow = 2;
    }
  }

  const rawData = XLSX.utils.sheet_to_json(ws, { defval: '', range: headerRow });
  if (!rawData.length) throw new Error('Sheet is empty');

  // Build lowercase column map
  console.log('📄 RAW HEADERS DETECTED:', Object.keys(rawData[0]));
  const colMap = {};
  Object.keys(rawData[0]).forEach(col => { colMap[col.trim().toLowerCase()] = col; });

  const colSeller = pick(colMap, ['Seller Name', 'Party Name']);
  const colBill = pick(colMap, ['Bill No', 'Invoice No', 'Inv. No.']);
  const colDate = pick(colMap, ['Invoice Date', 'Date']);
  const colPayDate = pick(colMap, ['Payment Date']);
  const colTotalWithTax = pick(colMap, ['Total With Tax', 'Total With Tax ', 'Total_with_tax']);
  const colTotalWithTaxAlt = pick(colMap, ['Zoho Total With Tax', 'Zoho total with tax']);
  const colMainAdv = pick(colMap, ['Main Advised No', 'Main Advise No']);
  const colSellerAdv = pick(colMap, ['Seller Advised No', 'Seller Advise No']);
  const colDR = pick(colMap, ['DR', 'Debit', 'Debit Amount']);
  const colAmt = pick(colMap, ['CR', 'Credit', 'Credit Amount']);
  const colTxnType = pick(colMap, ['Transaction Type', 'Transaction', 'Transacation Type']);
  const colTotalWoTax = pick(colMap, ['Total Without Tax', 'Total Without Tax ']);

  // Validate required columns
  const missing = [];
  if (!colSeller) missing.push('Seller Name');
  if (!colBill) missing.push('Bill No');
  if (!colDate) missing.push('Invoice Date');
  if (!colMainAdv) missing.push('Main Advised No');
  if (!colSellerAdv) missing.push('Seller Advised No');

  if (missing.length) {
    console.error('❌ COLUMN DETECTION FAILED:', { found: Object.keys(colMap), missing });
    throw new Error(`Missing required columns: ${missing.join(', ')}`);
  }

  console.log(`✅ EXCEL COLUMNS DETECTED: Seller=${colSeller}, Bill=${colBill}, Date=${colDate}`);

  // Filter empty rows
  const filtered = rawData.filter(row => {
    const seller = String(row[colSeller] || '').trim();
    return seller && seller.toLowerCase() !== 'nan';
  });

  const paymentDf = [];
  const debitRows = [];

  for (const row of filtered) {
    const sellerVal = String(row[colSeller] || '').trim();
    const billNo = String(row[colBill] || '').trim();
    const billLower = billNo.toLowerCase();
    
    if (['', 'total', 'nan'].includes(billLower) && !sellerVal) continue;

    const partyCode = deriveCode(sellerVal) || sellerVal;
    
    // Amount fallbacks (exactly like Python)
    let totalWithTax = 0;
    if (colTotalWithTax) {
      totalWithTax = safeNum(row[colTotalWithTax]);
    } else if (colTotalWithTaxAlt) {
      totalWithTax = safeNum(row[colTotalWithTaxAlt]);
    } else if (colTotalWoTax) {
      totalWithTax = safeNum(row[colTotalWoTax]);
    }

    const drAmt = colDR ? safeNum(row[colDR]) : 0;
    const crAmt = colAmt ? safeNum(row[colAmt]) : 0;

    // If no total column but we have CR/DR, derive pseudo total (Python logic)
    if (!colTotalWithTax && !colTotalWithTaxAlt && !colTotalWoTax && (colAmt || colDR)) {
      totalWithTax = crAmt + drAmt;
    }

    // paymentDf gets EVERY row (exactly like Python)
    paymentDf.push({
      'Party Name': sellerVal,
      'Party Code': partyCode,
      'Inv. No.': billNo,
      'Main Advised No.': colMainAdv ? String(row[colMainAdv] || '') : '',
      'Seller Advised No.': colSellerAdv ? String(row[colSellerAdv] || '') : '',
      'Pur. Date': colDate ? row[colDate] : '',
      'Total Inv. Amount': totalWithTax,
      'Debit Amount': drAmt,
      'Net Amount': totalWithTax - drAmt - crAmt,
      'Bank Payment': crAmt,
      'Payment Date': colPayDate ? row[colPayDate] : '',
      'Debit Note': drAmt > 0 ? billNo : '',
      'Transaction Type': row[colTxnType] || 'Payment',
    });

    // debitRows are synthesized from DR or CR amounts (exactly like Python)
    if (drAmt > 0) {
      debitRows.push({
        'Party Name': sellerVal,
        'Party Code': partyCode,
        'Date': colDate ? row[colDate] : '',
        'Return Invoice No.': billNo,
        'Amount': drAmt,
      });
    }

    if (crAmt > 0) {
      debitRows.push({
        'Party Name': sellerVal,
        'Party Code': partyCode,
        'Date': colDate ? row[colDate] : '',
        'Return Invoice No.': `${billNo} (CR)`,
        'Amount': crAmt * -1,
      });
    }
  }

  console.log(`✅ PROCESSED: ${paymentDf.length} Rows, ${debitRows.length} Debit Entries`);
  const debitDf = debitRows.length ? debitRows : [];
  return { paymentDf, debitDf };
}

/**
 * Validate that Invoice Date and Payment Date are never the same for any row.
 */
function validateDates(paymentDf) {
  for (const row of paymentDf) {
    const invDate = String(row['Pur. Date'] || '').trim();
    const payDate = String(row['Payment Date'] || '').trim();
    if (invDate && payDate && invDate === payDate) {
      throw new Error(`Invoice Date and Payment Date must not be the same for invoice: ${row['Inv. No.']}`);
    }
  }
}

/**
 * Match payment data with party emails — exact port of Python match_data() logic.
 */
function matchData(paymentDf, debitDf, partyEmails) {
  console.log(`🔍 STARTING MATCHING: ${paymentDf.length} Payments, ${debitDf.length} Debits, ${partyEmails.length} Registry Entries`);
  
  // Build lookup maps (exactly like Python email_map)
  const emailMap = {};
  for (const e of partyEmails) {
    const name = String(e.partyName || '').trim();
    if (!name) continue;
    const key = normalizeName(name);
    emailMap[key] = {
      to: String(e.email || '').split(',').map(s => s.trim()).filter(Boolean),
      cc: String(e.cc || '').split(',').map(s => s.trim()).filter(Boolean),
      displayName: name,
      partyCode: e.partyCode
    };
  }

  const result = [];
  const skipLogLines = [];
  const partiesWithoutEmail = [];

  // Identify parties in payment sheet that have no email (Python logic)
  const paymentParties = [...new Set(paymentDf.map(r => String(r['Party Name'] || '').trim()))];
  for (const partyNameVal of paymentParties) {
    const key = normalizeName(partyNameVal);
    const emailData = emailMap[key];
    if (!emailData || !emailData.to.length) {
      const pRows = paymentDf.filter(r => normalizeName(r['Party Name']) === key);
      partiesWithoutEmail.push({
        partyCode: partyNameVal,
        partyName: partyNameVal,
        paymentCount: pRows.length
      });
    }
  }

  // Main matching loop (exactly like Python)
  for (const [nameKey, emailData] of Object.entries(emailMap)) {
    const partyName = emailData.displayName;
    const partyCode = emailData.partyCode || partyName;

    // Filter payments for this party
    const partyPayments = paymentDf.filter(r => normalizeName(r['Party Name']) === nameKey);
    if (!partyPayments.length) {
      skipLogLines.push(`SKIPPED: ${partyName} — No payment rows found in Payment Sheet`);
      continue;
    }

    // Filter debits for this party
    const relatedDebits = debitDf.filter(r => normalizeName(r['Party Name']) === nameKey);
    
    // Only compare positive debit notes against payment debit amounts (exactly like Python)
    const totalDebitAmount = relatedDebits
      .filter(r => safeNum(r['Amount']) > 0)
      .reduce((sum, r) => sum + safeNum(r['Amount']), 0);

    const partyDebitSum = partyPayments.reduce((sum, r) => sum + safeNum(r['Debit Amount']), 0);

    // Mismatch check (Python uses 0.01 tolerance)
    if (Math.abs(partyDebitSum - totalDebitAmount) > 0.01) {
      console.warn(`⏭️ SKIPPING ${partyName}: Debit mismatch (${partyDebitSum.toFixed(2)} vs ${totalDebitAmount.toFixed(2)})`);
      skipLogLines.push(`SKIPPED: ${partyName} — Debit Amount mismatch between payment sheet and debit sheet`);
      continue;
    }

    console.log(`✅ MATCHED: ${partyName} -> ${emailData.to.join(', ')}`);
    result.push({
      partyCode: partyCode,
      partyName: partyName,
      emails: emailData.to,
      ccEmails: emailData.cc,
      payments: partyPayments,
      debits: relatedDebits,
    });
  }

  console.log(`🏁 MATCHING COMPLETE: ${result.length} Matched, ${skipLogLines.length} Skipped, ${partiesWithoutEmail.length} Missing Emails`);
  return { result, skipLogLines, partiesWithoutEmail };
}

module.exports = { loadExcel, matchData, validateDates, safeDateFormat, normalizeName, parseExcelDate };
