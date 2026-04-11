import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { sendEmails } from '../services/api';
import { Mail, KeyRound, Send, CheckCircle, XCircle } from 'lucide-react';

export default function GmailSettings({
  gmailUser, setGmailUser,
  gmailPassword, setGmailPassword,
  matchedResults,
  onSendComplete,
}) {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(null);

  const handleSend = async () => {
    if (!gmailUser) return toast.error('Please enter your Gmail address');
    if (!gmailPassword) return toast.error('Please enter your Gmail App Password');
    if (!matchedResults?.length) return toast.error('No matched parties to email');

    const confirmed = window.confirm(
      `You are about to send emails to ${matchedResults.length} parties.\n\nThis action cannot be undone. Continue?`
    );
    if (!confirmed) return;

    setSending(true);
    setProgress({ status: 'sending', message: 'Sending emails… (this may take a few minutes due to SMTP throttling)' });

    try {
      const res = await sendEmails(gmailUser, gmailPassword, matchedResults);
      const data = res.data.data;
      setProgress({
        status: 'done',
        sentCount: data.sentCount,
        failedCount: data.failedCount,
        results: data.results,
      });
      onSendComplete(data);
      toast.success(`✅ Done! Sent: ${data.sentCount}, Failed: ${data.failedCount}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send emails';
      toast.error(msg);
      setProgress({ status: 'error', message: msg });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="gmail-settings">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="form-group">
          <label>Authentication Email</label>
          <div className="input-container">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              className="has-icon"
              placeholder="billing@example.com"
              value={gmailUser}
              onChange={e => setGmailUser(e.target.value)}
              disabled={sending}
            />
          </div>
        </div>
        <div className="form-group">
          <label>App Password</label>
          <div className="input-container">
            <KeyRound size={18} className="input-icon" />
            <input
              type="password"
              className="has-icon"
              placeholder="•••• •••• •••• ••••"
              value={gmailPassword}
              onChange={e => setGmailPassword(e.target.value)}
              disabled={sending}
            />
          </div>
          <small style={{ marginTop: '8px', display: 'block', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
            Generate in Google Account Settings (Security &gt; App Passwords).
          </small>
        </div>
      </div>

      {gmailUser && gmailPassword && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '14px 48px', fontSize: '1rem', width: '100%', maxWidth: '500px' }}
            onClick={handleSend}
            disabled={sending || !matchedResults?.length}
          >
            {sending ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }} /> : <Send size={20} />}
            {sending
              ? 'Transmitting Emails...'
              : `Execute Batch (${matchedResults?.length || 0} Recipients)`}
          </button>
          {!sending && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: '500' }}>
              SMTP throttled with 1-5s random delays for better delivery rates.
            </span>
          )}
        </div>
      )}

      {progress && (
        <div className="send-progress" style={{ marginTop: '40px' }}>
          {progress.status === 'sending' && (
            <div className="alert alert-info glass" style={{ padding: '24px' }}>
              <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'var(--info)' }} />
              <div style={{ marginLeft: '12px' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Processing Queue</strong>
                <span style={{ color: 'var(--text-muted)' }}>{progress.message}</span>
              </div>
            </div>
          )}
          {progress.status === 'done' && (
            <div className="summary-grid">
              <div className="summary-card glass" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="summary-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  <CheckCircle size={24} />
                </div>
                <div className="summary-info">
                  <h3>{progress.sentCount}</h3>
                  <p>Delivered</p>
                </div>
              </div>
              <div className="summary-card glass" style={{ borderLeft: '4px solid var(--danger)' }}>
                <div className="summary-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  <XCircle size={24} />
                </div>
                <div className="summary-info">
                  <h3>{progress.failedCount}</h3>
                  <p>Failed</p>
                </div>
              </div>
            </div>
          )}
          {progress.status === 'error' && (
            <div className="alert alert-danger glass">
              <XCircle size={18} />
              <span>{progress.message}</span>
            </div>
          )}
          
          {progress.status === 'done' && progress.results?.filter(r => r.status === 'failed').length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--danger)', marginBottom: '12px' }}>Transmission Errors</h4>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Error Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.results.filter(r => r.status === 'failed').map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: '600' }}>{r.partyName}</td>
                        <td style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{r.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
