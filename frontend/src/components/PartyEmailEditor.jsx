import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPartyEmails, updatePartyEmail, downloadPartyEmailsCsv, triggerDownload } from '../services/api';
import { Edit2, Save, Lock, Download } from 'lucide-react';

export default function PartyEmailEditor() {
  const [parties, setParties] = useState([]);
  const [selected, setSelected] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    getPartyEmails()
      .then(res => setParties(res.data.data || []))
      .catch(() => toast.error('Failed to load party emails'))
      .finally(() => setFetching(false));
  }, []);

  const handleSelect = (partyCode) => {
    setSelected(partyCode);
    const party = parties.find(p => p.partyCode === partyCode);
    setNewEmail(party?.email || '');
    setPassword('');
  };

  const handleUpdate = async () => {
    if (!selected) return;
    if (!password) return toast.error('Please enter password to confirm');
    const party = parties.find(p => p.partyCode === selected);
    if (!party) return;
    setLoading(true);
    try {
      await updatePartyEmail(party._id, newEmail, password);
      toast.success(`Email updated for ${selected}`);
      setParties(prev =>
        prev.map(p => p.partyCode === selected ? { ...p, email: newEmail } : p)
      );
      setSelected('');
      setPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await downloadPartyEmailsCsv();
      triggerDownload(res.data, 'party_emails.csv');
      toast.success('Party emails exported');
    } catch {
      toast.error('Export failed');
    }
  };

  if (fetching) return <div className="loading-text">Loading party list…</div>;

  return (
    <div className="email-editor">
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={handleExport}>
          <Download size={16} style={{ marginRight: '8px' }} />
          Export CSV
        </button>
      </div>
      <div className="form-group" style={{ marginBottom: '32px' }}>
        <label>Select Identity</label>
        <select
          value={selected}
          onChange={e => handleSelect(e.target.value)}
          className="select-input glass"
          style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}
        >
          <option value="">— Choose a party to manage —</option>
          {parties.map(p => (
            <option key={p._id} value={p.partyCode}>
              {p.partyName} ({p.partyCode})
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid var(--border-subtle)', animation: 'slideUp 0.4s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Communication Channels (Emails)</label>
              <div className="input-container">
                <Edit2 size={18} className="input-icon" />
                <input
                  type="text"
                  className="has-icon"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="name@company.com, support@company.com"
                />
              </div>
              <small style={{ marginTop: '8px', display: 'block', color: 'var(--text-dim)', fontSize: '0.75rem' }}>Separate multiple contacts with commas.</small>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Security Clearance</label>
              <div className="input-container">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  className="has-icon"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Confirm admin password"
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <button
                className="btn btn-primary btn-full"
                style={{ height: '48px' }}
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'white' }} /> : <Save size={18} />}
                {loading ? 'Committing Changes...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
