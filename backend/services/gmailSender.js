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

      // 3. Validate and filter email addresses
      const isValidEmail = (email) => {
        if (!email || typeof email !== 'string') return false;
        const trimmed = email.trim();
        if (!trimmed) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmed);
      };

      const toEmails = Array.isArray(to) ? to.filter(isValidEmail) : (to ? [to] : []);
      const ccEmails = cc ? (Array.isArray(cc) ? cc.filter(isValidEmail) : [cc].filter(isValidEmail)) : [];

      if (!toEmails.length) {
        throw new Error('No valid recipient email addresses');
      }

      // 4. Construct Multipart MIME Message (Enterprise Grade)
      const mailOptions = {
        from: authRecord.email,
        to: toEmails.join(', '),
        cc: ccEmails.length > 0 ? ccEmails.join(', ') : undefined,
        subject: subject,
        text: text,
        html: html,
        attachments: attachments || []
      };

      const composer = new MailComposer(mailOptions);
      const messageBuffer = await composer.compile().build();
      
      // 5. Base64URL Encode for Google API Requirements
      const encodedMessage = messageBuffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // 6. High-Priority Dispatch
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
