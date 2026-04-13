const { google } = require('googleapis');
const { GoogleAuth } = require('../models');
const MailComposer = require('nodemailer/lib/mail-composer');

/**
 * GMAIL ENTERPRISE DISPATCH SERVICE
 * --------------------------------
 * Robust OAuth2 email transmission service using Google APIs.
 * Supports HTML bodies and high-volume Excel attachments.
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
      // 1. Fetch active infrastructure record
      const authRecord = await GoogleAuth.findOne({ isActive: true });
      if (!authRecord) {
        throw new Error('Enterprise Dispatcher Offline: No active Gmail account connected.');
      }

      // 2. Refresh Gateway Credentials
      this.oauth2Client.setCredentials({
        refresh_token: authRecord.refreshToken
      });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // 3. Construct Multipart MIME Message (Enterprise Grade)
      // Using MailComposer ensures correct boundary management for attachments
      const mailOptions = {
        from: authRecord.email,
        to: Array.isArray(to) ? to.join(', ') : to,
        cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
        subject: subject,
        text: text,
        html: html,
        attachments: attachments || []
      };

      const composer = new MailComposer(mailOptions);
      const messageBuffer = await composer.compile().build();
      
      // 4. Base64URL Encode for Google API Requirements
      const encodedMessage = messageBuffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // 5. High-Priority Dispatch
      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      console.log(`📡 DISPATCH SUCCESS: [MsgID: ${res.data.id}] Sent via ${authRecord.email}`);
      return { success: true, messageId: res.data.id, email: authRecord.email };
    } catch (err) {
      console.error('❌ GMAIL ENTERPRISE ERROR:', err.message);
      throw err;
    }
  }
}

module.exports = new GmailSender();
