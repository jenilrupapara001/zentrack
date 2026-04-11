import React from 'react';
import toast from 'react-hot-toast';
import {
  downloadEmailLogTxt,
  downloadEmailLogExcel,
  triggerDownload,
  downloadPartywiseExcel,
} from '../services/api';
import { FileText, FileSpreadsheet, Download } from 'lucide-react';

export default function EmailLogDownload({ matchedResults }) {
  const handleTxt = async () => {
    try {
      const res = await downloadEmailLogTxt();
      triggerDownload(res.data, 'FinalEmailLog.txt');
    } catch {
      toast.error('No log available yet. Send emails first.');
    }
  };

  const handleExcel = async () => {
    try {
      const res = await downloadEmailLogExcel();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      triggerDownload(res.data, `FinalEmailLog_${timestamp}.xlsx`);
    } catch {
      toast.error('No log available yet. Send emails first.');
    }
  };

  const handlePartywise = async () => {
    try {
      const res = await downloadPartywiseExcel();
      const timestamp = new Date().toISOString().slice(0, 10);
      triggerDownload(res.data, `All_Partywise_Payments_${timestamp}.xlsx`);
    } catch {
      toast.error('No reconciliation data available. Upload and process an Excel first.');
    }
  };

  return (
    <div className="log-download">
      <p className="log-info" style={{ color: 'var(--text-dim)', marginBottom: '32px', fontSize: '0.9rem' }}>
        Access your historical transmission logs and processed reconciliation data. 
        Records are securely architected in the database for cross-session persistence.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ color: 'var(--primary)', opacity: '0.8' }}>
            <FileText size={32} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>System Activity Log</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Raw transmission details and SMTP status reports.</p>
          </div>
          <button className="btn btn-secondary btn-full" onClick={handleTxt}>
            Download TXT
          </button>
        </div>

        <div className="glass" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ color: 'var(--primary)', opacity: '0.8' }}>
            <FileSpreadsheet size={32} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Log Analytics</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Structured report of all delivery outcomes and timestamps.</p>
          </div>
          <button className="btn btn-secondary btn-full" onClick={handleExcel}>
            Download XLSX
          </button>
        </div>

        {matchedResults?.length > 0 && (
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ color: 'var(--amber)', opacity: '0.8' }}>
              <Download size={32} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Processed Assets</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>All party-wise payment sheets generated in this session.</p>
            </div>
            <button className="btn btn-secondary btn-full" onClick={handlePartywise}>
              Download Package
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
