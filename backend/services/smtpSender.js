/**
 * SMTP sending service — mirrors Python send_email() using nodemailer
 */
const nodemailer = require('nodemailer');

/**
 * Creates a hardened, pooled Nodemailer transporter
 * @param {Object} options 
 * @param {string} options.user
 * @param {string} options.pass
 * @param {string} options.host
 * @param {number} options.port
 * @param {boolean} options.secure
 */
function createTransporter(options) {
  const { user, pass, host = 'smtp.gmail.com', port = 465, secure = true } = options;
  
  return nodemailer.createTransport({
    host,
    port,
    secure,
    pool: true, // Enable connection pooling for batch sends
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user,
      pass,
    },
    // Increased timeouts for production reliability
    connectionTimeout: 20000, // 20 seconds
    greetingTimeout: 15000,   // 15 seconds
    socketTimeout: 30000,     // 30 seconds
    tls: {
      rejectUnauthorized: false // Helps with some SMTP server certificate issues
    }
  });
}

/**
 * Send an HTML email via a provided transporter or a one-off connection.
 */
async function sendEmail(transporterOrOptions, toEmails, subject, htmlBody, cc = []) {
  let transporter;
  let isOneOff = false;

  if (transporterOrOptions.sendMail) {
    transporter = transporterOrOptions;
  } else {
    transporter = createTransporter(transporterOrOptions);
    isOneOff = true;
  }

  const mailOptions = {
    from: transporter.options.auth.user,
    to: toEmails.join(', '),
    cc: cc.length ? cc.join(', ') : undefined,
    subject,
    html: htmlBody,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } finally {
    if (isOneOff) {
      transporter.close();
    }
  }
}

/**
 * Random delay between min and max ms
 */
function randomDelay(minMs = 1000, maxMs = 5000) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { createTransporter, sendEmail, randomDelay };
