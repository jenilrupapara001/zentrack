import React from 'react';
import toast from 'react-hot-toast';
import { downloadSamplePaymentExcel, downloadSampleMailExcel, triggerDownload } from '../services/api';
import { Download } from 'lucide-react';

export default function SampleDownloads() {
  const handleDownload = async (fn, filename) => {
    try {
      const res = await fn();
      triggerDownload(res.data, filename);
    } catch {
      toast.error(`Failed to download ${filename}`);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      <div className="glass" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ color: 'var(--primary)', opacity: '0.8' }}>
          <Download size={32} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Invoices Template</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Contains sample payment structure for primary data upload.</p>
        </div>
        <button
          className="btn btn-secondary btn-full"
          onClick={() => handleDownload(downloadSamplePaymentExcel, 'SampleInvoices.xlsx')}
        >
          Download XLSX
        </button>
      </div>

      <div className="glass" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ color: 'var(--primary)', opacity: '0.8' }}>
          <Download size={32} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Vendors Template</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Reference structure for party codes and contact emails.</p>
        </div>
        <button
          className="btn btn-secondary btn-full"
          onClick={() => handleDownload(downloadSampleMailExcel, 'SampleMail.xlsx')}
        >
          Download XLSX
        </button>
      </div>
    </div>
  );
}
