const { google } = require('googleapis');
const { GoogleAuth } = require('../models');

/**
 * GMAIL API DISPATCH SERVICE
 * -------------------------
 * Handles OAuth2 email transmission using Google APIs.
 */
class GmailSender {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async sendMail({ to, cc, subject, text, html, attachments }) {
    try {
      // 1. Fetch the active Gmail connection
      const authRecord = await GoogleAuth.findOne({ isActive: true });
      if (!authRecord) {
        throw new Error('No active Gmail account connected.');
      }

      // 2. Configure credentials
      this.oauth2Client.setCredentials({
        refresh_token: authRecord.refreshToken
      });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // 3. Construct Raw Email (MIME)
      const messageParts = [
        `From: <${authRecord.email}>`,
        `To: ${Array.isArray(to) ? to.join(', ') : to}`,
        cc ? `Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}` : '',
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        html || text,
      ];

      const rawMessage = messageParts.join('\n');
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // 4. Dispatch
      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return { success: true, messageId: res.data.id, email: authRecord.email };
    } catch (err) {
      console.error('❌ GMAIL API ERROR:', err.message);
      throw err;
    }
  }
}

module.exports = new GmailSender();
