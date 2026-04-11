import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { uploadPaymentExcel } from '../services/api';
import { Upload, FileSpreadsheet, CheckCircle, Users, SkipForward, AlertTriangle } from 'lucide-react';

export default function PaymentExcelUpload({ onDataLoaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const onDrop = useCallback((accepted) => {
    if (accepted.length) {
      setFile(accepted[0]);
      setSummary(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });

  const handleProcess = async () => {
    if (!file) return toast.error('Please select an Excel file');
    setLoading(true);
    try {
      const res = await uploadPaymentExcel(file);
      const data = res.data.data;
      setSummary(data.summary);
      onDataLoaded(data);
      toast.success(`✅ Processed! ${data.summary.matched} parties ready to email.`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Processing failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-section">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="dropzone-file">
            <FileSpreadsheet size={40} color="var(--primary)" />
            <span style={{ fontWeight: '600' }}>{file.name}</span>
            <small style={{ color: 'var(--text-dim)' }}>{(file.size / 1024).toFixed(1)} KB</small>
          </div>
        ) : (
          <div className="dropzone-empty">
            <Upload size={40} className="dropzone-icon" />
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>
              {isDragActive ? 'Release to drop…' : 'Drop Payment Excel here'}
            </p>
            <small style={{ color: 'var(--text-dim)' }}>Supports legacy (2-sheet) & new formats</small>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          style={{ padding: '12px 32px' }}
          onClick={handleProcess}
          disabled={loading || !file}
        >
          {loading ? <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'white' }} /> : <Upload size={18} />}
          {loading ? 'Processing…' : 'Process Data'}
        </button>
      </div>

      {summary && (
        <div className="summary-grid" style={{ marginTop: '32px' }}>
          <div className="summary-card glass" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="summary-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              <CheckCircle size={24} />
            </div>
            <div className="summary-info">
              <h3>{summary.matched}</h3>
              <p>Ready</p>
            </div>
          </div>
          <div className="summary-card glass" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="summary-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <SkipForward size={24} />
            </div>
            <div className="summary-info">
              <h3>{summary.skipped}</h3>
              <p>Skipped</p>
            </div>
          </div>
          <div className="summary-card glass" style={{ borderLeft: '4px solid var(--danger)' }}>
            <div className="summary-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="summary-info">
              <h3>{summary.withoutEmail}</h3>
              <p>No Email</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
