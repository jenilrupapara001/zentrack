import React from 'react';
import toast from 'react-hot-toast';
import { downloadNoEmailCsv, triggerDownload } from '../services/api';
import { Building2, Mail, Download, AlertTriangle } from 'lucide-react';

export default function PartiesWithoutEmail({ parties }) {
  const totalRecords = parties.reduce((sum, p) => sum + p.paymentCount, 0);
  const avgRecords = parties.length ? (totalRecords / parties.length).toFixed(1) : '0.0';

  const handleDownload = async () => {
    try {
      const res = await downloadNoEmailCsv(parties);
      triggerDownload(res.data, 'parties_without_email.csv');
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <div className="no-email-section">
      {/* Metrics */}
      <div className="metrics-row">
        <div className="metric-card orange">
          <div className="metric-num">{parties.length}</div>
          <div className="metric-label">Total Parties</div>
        </div>
        <div className="metric-card">
          <div className="metric-num">{totalRecords}</div>
          <div className="metric-label">Total Payment Records</div>
        </div>
        <div className="metric-card">
          <div className="metric-num">{avgRecords}</div>
          <div className="metric-label">Avg Records / Party</div>
        </div>
      </div>

      {/* Party cards — 2 per row like Streamlit */}
      <div className="no-email-grid">
        {parties.map((party, i) => (
          <div key={i} className="no-email-card">
            <div className="no-email-card-top">
              <Building2 size={20} />
              <span className="no-email-name">{party.partyName}</span>
            </div>
            <div className="no-email-card-meta">
              <span><strong>Code:</strong> {party.partyCode}</span>
              <span><strong>Payment Records:</strong> {party.paymentCount}</span>
            </div>
            <div className="no-email-badge">
              <Mail size={12} /> Email Required
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary" onClick={handleDownload}>
        <Download size={16} /> Download Parties Without Email (CSV)
      </button>

      <div className="alert alert-info next-steps">
        <AlertTriangle size={16} />
        <div>
          <strong>To enable email sending for these parties:</strong>
          <ol>
            <li>Update the party email list via the protected upload section above</li>
            <li>Ensure each party has a valid email address</li>
            <li>Re-upload the payment Excel file to reprocess</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
