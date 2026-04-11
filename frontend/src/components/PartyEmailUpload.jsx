import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { uploadPartyEmails } from '../services/api';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle } from 'lucide-react';

export default function PartyEmailUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onDrop = useCallback((accepted) => {
    if (accepted.length) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return toast.error('Please select an Excel file');

    setLoading(true);
    setResult(null);
    try {
      const res = await uploadPartyEmails(file);
      setResult(res.data);
      toast.success(res.data.message);
      setFile(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed';
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
              {isDragActive ? 'Release to drop…' : 'Drop Party List Excel'}
            </p>
            <small style={{ color: 'var(--text-dim)' }}>Required: Code, Name, Email, CC</small>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          style={{ padding: '12px 32px' }}
          onClick={handleUpload}
          disabled={loading || !file}
        >
          {loading ? <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'white' }} /> : <Upload size={18} />}
          {loading ? 'Uploading…' : 'Sync Party Emails'}
        </button>
      </div>

      {result && (
        <div className="upload-result" style={{ marginTop: '32px' }}>
          <div className="alert alert-success glass">
            <CheckCircle size={18} />
            <span style={{ fontWeight: '500' }}>{result.message}</span>
          </div>
          {result.missingEmails?.length > 0 && (
            <div className="alert alert-warning glass" style={{ marginTop: '12px' }}>
              <AlertTriangle size={18} />
              <div>
                <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missing Contact Details</strong>
                <ul style={{ marginTop: '8px' }}>
                  {result.missingEmails.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
