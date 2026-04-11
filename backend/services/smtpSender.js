/**
 * SMTP sending service — mirrors Python send_email() using nodemailer
 */
const nodemailer = require('nodemailer');

/**
 * Send an HTML email via Gmail SMTP.
 * @param {string} gmailUser
 * @param {string} appPassword  - Gmail App Password
 * @param {string[]} toEmails
 * @param {string} subject
 * @param {string} htmlBody
 * @param {string[]} cc
 */
async function sendEmail(gmailUser, appPassword, toEmails, subject, htmlBody, cc = []) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: appPassword,
    },
  });

  const mailOptions = {
    from: gmailUser,
    to: toEmails.join(', '),
    cc: cc.length ? cc.join(', ') : undefined,
    subject,
    html: htmlBody,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Random delay between min and max ms — mirrors Python time.sleep(random.uniform(1,5))
 */
function randomDelay(minMs = 1000, maxMs = 5000) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { sendEmail, randomDelay };
