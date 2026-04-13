/**
 * Email body generator — exact port of Python generate_email_body()
 */
const { safeDateFormat, parseExcelDate } = require('./excelParser');

const EMAIL_TEMPLATE = `
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <p>Dear [Party Name],</p>
    <p>Please find below the summary of your recent transactions with us:</p>
    <h3>Purchase &amp; Payment Details</h3>
    <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f2f2f2; border: 2px solid #333;">
          <th style="border: 1px solid #333; padding: 8px;">Purchase Bill</th>
          <th style="border:1px solid #ddd; padding: 8px;">Main Advised No.</th>
          <th style="border:1px solid #ddd; padding: 8px;">Seller Advised No.</th>
          <th style="border:1px solid #ddd; padding: 8px;">Transaction Type</th>
          <th style="border:1px solid #ddd; padding: 8px;">Pur. Date</th>
          <th style="border:1px solid #ddd; padding: 8px;">Credit (CR)</th>
          <th style="border:1px solid #ddd; padding: 8px;">Debit (DR)</th>
          <th style="border:1px solid #ddd; padding: 8px;">Balance</th>
        </tr>
      </thead>
      <tbody>
        <!-- Dynamic payment rows inserted here -->
      </tbody>
    </table>
  </body>
</html>
`;

function safeNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function isNullish(val) {
  return val === null || val === undefined || val === '' || String(val).toLowerCase() === 'nan';
}

/**
 * Generate HTML email body for a given party.
 * @param {string} partyCode - display name (actually party name)
 * @param {Array}  paymentRows
 * @param {Array}  debitRows  (currently unused in template but kept for parity)
 * @param {Array}  partyEmails - full list for display name lookup
 */
function generateEmailBody(partyCode, paymentRows, debitRows, partyEmails = []) {
  // Lookup display name
  const normalize = s => String(s || '').replace(/\s+/g, '').toLowerCase();
  const lookupKey = normalize(partyCode);
  const partyName = partyEmails.find(e => normalize(e.partyName) === lookupKey)?.partyName
    || partyCode
    || 'Unknown Party';

  let paymentHtml = '';
  let totalCredit = 0;
  let totalDebit  = 0;
  let runningBalance = 0;
  const paymentDates = [];

  for (const row of paymentRows) {
    const dr = safeNum(row['Debit Amount']);
    const cr = safeNum(row['Bank Payment']);

    totalCredit    += cr;
    totalDebit     += dr;
    runningBalance += cr - dr;

    const invNo        = isNullish(row['Inv. No.'])           ? '-' : String(row['Inv. No.']);
    const mainAdv      = isNullish(row['Main Advised No.'])    ? '-' : String(row['Main Advised No.']);
    const sellerAdv    = isNullish(row['Seller Advised No.'])  ? '-' : String(row['Seller Advised No.']);
    const purDate      = safeDateFormat(row['Pur. Date'])      || '-';
    const txnType      = isNullish(row['Transaction Type'])    ? '-' : String(row['Transaction Type']);
    const drDisplay    = dr === 0 ? '-' : dr.toFixed(2);
    const crDisplay    = cr === 0 ? '-' : cr.toFixed(2);
    const balDisplay   = runningBalance.toFixed(2);

    paymentHtml += `
        <tr style="text-align:center; border:1px solid #ccc;">
          <td style="border:1px solid #ccc;">${invNo}</td>
          <td style="border:1px solid #ccc;">${mainAdv}</td>
          <td style="border:1px solid #ccc;">${sellerAdv}</td>
          <td style="border:1px solid #ccc;">${txnType}</td>
          <td style="border:1px solid #ccc;">${purDate}</td>
          <td style="border:1px solid #ccc;">${crDisplay}</td>
          <td style="border:1px solid #ccc;">${drDisplay}</td>
          <td style="border:1px solid #ccc;">${balDisplay}</td>
        </tr>`;

    const payDate = row['Payment Date'];
    if (payDate && !isNullish(payDate)) paymentDates.push(payDate);
  }

  const finalBalance = totalCredit - totalDebit;

  // Total row
  paymentHtml += `
    <tr style="text-align:center; font-weight:bold; background-color:#f9f9f9;">
      <td colspan="5" style="border:1px solid #ccc;">Total</td>
      <td style="border:1px solid #ccc;">${totalCredit.toFixed(2)}</td>
      <td style="border:1px solid #ccc;">${totalDebit.toFixed(2)}</td>
      <td style="border:1px solid #ccc;">${finalBalance.toFixed(2)}</td>
    </tr>`;

  // Bank final amount row
  paymentHtml += `
    <tr style="text-align:center; font-weight:bold; background-color:#f9f9f9;">
      <td colspan="7" style="border:1px solid #ccc; text-align:right;">Bank Final Amount</td>
      <td style="border:1px solid #ccc;">${finalBalance.toFixed(2)}</td>
    </tr>`;

  // Compute latest payment date
  let latestPaymentDate = 'N/A';
  if (paymentDates.length) {
    const parsed = paymentDates.map(d => parseExcelDate(d)).filter(d => d !== null);
    if (parsed.length) {
      latestPaymentDate = safeDateFormat(new Date(Math.max(...parsed.map(d => d.getTime())))) || 'N/A';
    }
  }

  const closingNote = `
    <br><br>
    <p><strong>🔔 Important Note:</strong> If you have any discrepancies or concerns regarding the above payment summary, please raise the issue within 7 days. No changes or claims will be entertained after this period.</p>
    <p>Thank you for your continued partnership.</p>
    <p>Best regards,<br><strong>Easy Sell Service Pvt. Ltd.</strong></p>`;

  let htmlBody = EMAIL_TEMPLATE
    .replace('[Party Name]', partyName)
    .replace('<!-- Dynamic payment rows inserted here -->', paymentHtml);

  htmlBody = htmlBody.replace(
    '</table>',
    `</table>\n<p><strong>Bank Payment Date:</strong> ${latestPaymentDate}</p>`
  );
  htmlBody = htmlBody.replace('</body>', `${closingNote}</body>`);

  return htmlBody;
}

module.exports = { generateEmailBody };
