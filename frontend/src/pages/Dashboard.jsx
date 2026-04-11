import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { logout } from '../services/api';
import SampleDownloads from '../components/SampleDownloads';
import PartyEmailUpload from '../components/PartyEmailUpload';
import PartyEmailEditor from '../components/PartyEmailEditor';
import PaymentExcelUpload from '../components/PaymentExcelUpload';
import GmailSettings from '../components/GmailSettings';
import MatchedResults from '../components/MatchedResults';
import SkippedParties from '../components/SkippedParties';
import PartiesWithoutEmail from '../components/PartiesWithoutEmail';
import EmailLogDownload from '../components/EmailLogDownload';
import { LogOut, Mail, CheckCircle2, Circle } from 'lucide-react';

export default function Dashboard({ onLogout }) {
  const [reconciliationData, setReconciliationData] = useState(null);
  const [gmailUser, setGmailUser] = useState('');
  const [gmailPassword, setGmailPassword] = useState('');
  const [sendResult, setSendResult] = useState(null);

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header glass">
        <div className="header-left">
          <div className="header-icon">
            <Mail size={32} />
          </div>
          <div className="header-content">
            <h1 className="text-gradient">Mail Sender</h1>
            <span className="header-sub">Easy Sell Service Pvt. Ltd.</span>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      <main className="dashboard-main">
        {/* Progress Tracker */}
        <div className="progress-tracker glass" style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '24px 40px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '20px'
        }}>
          {[
            { tag: 'samples', label: 'Samples', step: 1 },
            { tag: 'emails', label: 'Parties', step: 2 },
            { tag: 'upload', label: 'Payment', step: 3 },
            { tag: 'send', label: 'Execute', step: 4 }
          ].map((s, i) => {
            const currentStep = !reconciliationData ? 1 : (reconciliationData.matchedResults ? 4 : 3);
            const active = s.step <= currentStep;
            return (
              <div key={s.tag} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                opacity: active ? 1 : 0.4,
                flex: 1,
                position: 'relative'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: active ? 'var(--primary)' : 'var(--border)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: active ? '0 0 15px rgba(139, 92, 246, 0.4)' : 'none'
                }}>
                  {s.step < currentStep ? <CheckCircle2 size={16} /> : s.step}
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: active ? 'var(--text)' : 'var(--text-dim)' }}>{s.label}</span>
                {i < 3 && <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: 'calc(50% + 24px)',
                  right: 'calc(-50% + 24px)',
                  height: '2px',
                  background: active && (s.step < currentStep) ? 'var(--primary)' : 'var(--border)',
                  zIndex: -1
                }} />}
              </div>
            );
          })}
        </div>
        {/* Step 1: Sample Downloads */}
        <Section title="📥 Download Sample Files" step="1">
          <SampleDownloads />
        </Section>

        {/* Step 2: Upload Party Emails */}
        <Section title="📁 Upload Party Emails" step="2" collapsible>
          <PartyEmailUpload />
        </Section>

        {/* Step 3: Upload Payment Excel */}
        <Section title="📁 Upload Payment Details Excel" step="3">
          <PaymentExcelUpload onDataLoaded={setReconciliationData} />
        </Section>

        {reconciliationData && (
          <>
            {/* Column info */}
            <Section title="📋 Detected Columns" step="">
              <div className="columns-info">
                <div>
                  <strong>Payment Sheet:</strong>
                  <div className="tag-list">
                    {reconciliationData.paymentColumns.map(c => <span key={c} className="tag">{c}</span>)}
                  </div>
                </div>
                <div>
                  <strong>Debit Notes Sheet:</strong>
                  <div className="tag-list">
                    {reconciliationData.debitColumns.map(c => <span key={c} className="tag">{c}</span>)}
                  </div>
                </div>
              </div>
            </Section>

            {/* Edit party emails */}
            <Section title="📬 Edit Party Emails" step="">
              <PartyEmailEditor />
            </Section>

            {/* Parties without email */}
            {reconciliationData.partiesWithoutEmail?.length > 0 && (
              <Section title="⚠️ Parties Without Email Addresses" step="">
                <PartiesWithoutEmail parties={reconciliationData.partiesWithoutEmail} />
              </Section>
            )}

            {/* Skipped parties */}
            {reconciliationData.skipLogLines?.length > 0 && (
              <Section title="⏭️ Skipped Parties" step="">
                <SkippedParties
                  skips={reconciliationData.skipLogLines}
                  matchedCount={reconciliationData.matchedResults?.length || 0}
                />
              </Section>
            )}

            {/* Gmail settings + send */}
            <Section title="📧 Gmail Settings & Send Emails" step="4">
              <GmailSettings
                gmailUser={gmailUser}
                setGmailUser={setGmailUser}
                gmailPassword={gmailPassword}
                setGmailPassword={setGmailPassword}
                matchedResults={reconciliationData?.matchedResults || []}
                onSendComplete={setSendResult}
              />
            </Section>

            {/* Matched results preview */}
            {reconciliationData.matchedResults?.length > 0 && (
              <Section title="✅ Ready to Email" step="">
                <MatchedResults
                  results={reconciliationData.matchedResults}
                  sendResult={sendResult}
                />
              </Section>
            )}
          </>
        )}

        {/* Email log downloads - always visible */}
        <Section title="📊 Email Log" step="">
          <EmailLogDownload
            skipLog={reconciliationData?.skipLogLines}
            partiesWithoutEmail={reconciliationData?.partiesWithoutEmail}
            matchedResults={reconciliationData?.matchedResults}
          />
        </Section>
      </main>
    </div>
  );
}

function Section({ title, step, children, collapsible }) {
  const [open, setOpen] = useState(true);

  return (
    <section className="dashboard-section glass">
      <div
        className={`section-header ${collapsible ? 'collapsible' : ''}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        {step && <span className="step-badge">{step}</span>}
        <h2>{title}</h2>
        {collapsible && (
          <span className="chevron" style={{ transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        )}
      </div>
      {(!collapsible || open) && <div className="section-body">{children}</div>}
    </section>
  );
}
