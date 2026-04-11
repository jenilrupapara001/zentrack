/**
 * SMTP sending service — Production-Grade version
 * Implements a Singleton Transporter pattern and Enterprise Retry Logic.
 */
const nodemailer = require('nodemailer');

// Singleton instance
let transporter;

/**
 * Create or reuse transporter (singleton pattern)
 * This prevents creating multiple connections during a batch send.
 */
function getTransporter(gmailUser, appPassword) {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: gmailUser,
      pass: appPassword,
    },
    pool: true, // ✅ connection pooling
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });

  return transporter;
}

/**
 * Send an HTML email via Gmail SMTP
 */
async function sendEmail(
  gmailUser,
  appPassword,
  toEmails,
  subject,
  htmlBody,
  cc = []
) {
  try {
    // Input validation
    if (!gmailUser || !appPassword) {
      throw new Error('Missing SMTP credentials');
    }

    if (!Array.isArray(toEmails) || toEmails.length === 0) {
      throw new Error('Recipient email list is empty');
    }

    const t = getTransporter(gmailUser, appPassword);

    const msg = {
      from: gmailUser,
      to: toEmails.join(', '),
      cc: cc && cc.length ? cc.join(', ') : undefined,
      subject,
      html: htmlBody,
    };

    const startTime = Date.now();
    const info = await t.sendMail(msg);

    // Logging for audit trail
    console.log('Email sent:', {
      messageId: info.messageId,
      to: msg.to,
      response: info.response,
      timeMs: Date.now() - startTime,
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };

  } catch (error) {
    console.error('Email send failed:', {
      error: error.message,
      to: toEmails,
      subject,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Retry wrapper (enterprise-level reliability)
 */
async function sendEmailWithRetry(
  gmailUser,
  appPassword,
  toEmails,
  subject,
  htmlBody,
  cc = [],
  retries = 3
) {
  let attempt = 0;

  while (attempt < retries) {
    const result = await sendEmail(
      gmailUser,
      appPassword,
      toEmails,
      subject,
      htmlBody,
      cc
    );

    if (result.success) return result;

    attempt++;
    console.warn(`Retry ${attempt}/${retries} failed for ${toEmails[0]}`);

    if (attempt < retries) {
      await randomDelay(2000, 5000); // wait before retry
    }
  }

  return {
    success: false,
    error: `All ${retries} retry attempts failed`,
  };
}

/**
 * Random delay between min and max ms
 */
function randomDelay(minMs = 1000, maxMs = 5000) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verify connection to SMTP server
 */
async function verifyConnection(gmailUser, appPassword) {
  try {
    if (!gmailUser || !appPassword) {
      throw new Error('Missing credentials for verification');
    }
    const t = getTransporter(gmailUser, appPassword);
    await t.verify();
    return { success: true };
  } catch (error) {
    console.error('SMTP Verification failed:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  sendEmailWithRetry,
  randomDelay,
  verifyConnection,
};
