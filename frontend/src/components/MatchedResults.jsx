import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { downloadPartywiseExcel, triggerDownload } from '../services/api';
import { ChevronDown, ChevronRight, CheckCircle, Download, Mail } from 'lucide-react';

export default function MatchedResults({ results, sendResult }) {
  const [expanded, setExpanded] = useState({});
  const [downloading, setDownloading] = useState(false);

  const toggle = (code) => setExpanded(p => ({ ...p, [code]: !p[code] }));

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadPartywiseExcel();
      triggerDownload(res.data, `All_Partywise_Payments_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const getStatus = (partyCode) => {
    if (!sendResult?.results) return null;
    return sendResult.results.find(r => r.partyCode === partyCode);
  };

  return (
    <div className="matched-results">
      <div className="matched-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-amber" style={{ padding: '6px 14px', fontSize: '13px' }}>
            {results.length} Entities Ready
          </span>
        </div>
        <button className="btn btn-secondary" onClick={handleDownload} disabled={downloading}>
          {downloading ? <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'var(--text)' }} /> : <Download size={16} />}
          Bulk Download Party-wise Excel
        </button>
      </div>

      <div className="party-list">
        {results.map((entry, i) => {
          const isOpen = expanded[entry.partyCode];
          const status = getStatus(entry.partyCode);

          return (
            <div 
              key={i} 
              className={`party-card glass glass-hover ${isOpen ? 'is-open' : ''}`} 
              style={{ padding: '0', marginBottom: '12px', borderLeft: status?.status === 'sent' ? '4px solid var(--success)' : status?.status === 'failed' ? '4px solid var(--danger)' : '1px solid var(--border)' }}
            >
              <div 
                className="party-card-header" 
                onClick={() => toggle(entry.partyCode)}
                style={{ padding: '16px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{ transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-dim)' }}>
                    <ChevronDown size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.95rem' }}>{entry.partyCode}</div>
                    <div className="party-meta" style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        <Mail size={12} /> {entry.emails[0]}{entry.emails.length > 1 ? ` +${entry.emails.length - 1}` : ''}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>•</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{entry.payments.length} Records</span>
                    </div>
                  </div>
                </div>
                <div className="party-card-right">
                  {status?.status === 'sent' && <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>SENT</span>}
                  {status?.status === 'failed' && <span className="badge" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>FAILED</span>}
                  {!status && <span className="badge" style={{ background: 'var(--border-subtle)', color: 'var(--text-dim)' }}>QUEUED</span>}
                </div>
              </div>

              {isOpen && (
                <div className="party-card-body" style={{ padding: '24px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255,255,255, 0.01)' }}>
                  {/* CC emails */}
                  {entry.ccEmails?.length > 0 && (
                    <div style={{ marginBottom: '20px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-dim)', fontWeight: '600' }}>RECIPIENTS (CC):</span>
                      <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>{entry.ccEmails.join(', ')}</span>
                    </div>
                  )}

                  {/* Payment rows table */}
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Inv. No.</th>
                          <th>Transaction</th>
                          <th>Purchase Date</th>
                          <th>Total Amount</th>
                          <th>Debit</th>
                          <th>Bank Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.payments.map((p, j) => (
                          <tr key={j}>
                            <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{p['Inv. No.'] || '-'}</td>
                            <td style={{ fontSize: '0.75rem' }}>{p['Transaction Type'] || '-'}</td>
                            <td style={{ fontVariantNumeric: 'tabular-nums' }}>{p['Pur. Date'] ? new Date(p['Pur. Date']).toLocaleDateString('en-IN') : '-'}</td>
                            <td style={{ fontVariantNumeric: 'tabular-nums' }}>{p['Total Inv. Amount'] != null ? Number(p['Total Inv. Amount']).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                            <td style={{ fontVariantNumeric: 'tabular-nums', color: p['Debit Amount'] > 0 ? 'var(--warning)' : 'inherit' }}>{p['Debit Amount'] > 0 ? Number(p['Debit Amount']).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                            <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', color: 'var(--success)' }}>{p['Bank Payment'] > 0 ? Number(p['Bank Payment']).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Debit notes */}
                  {entry.debits?.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: '12px' }}>Deduction Details (Debit Notes)</h4>
                      <div className="table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>Ref. Return Invoice</th>
                              <th>Date</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.debits.map((d, j) => (
                              <tr key={j}>
                                <td>{d['Return Invoice No.'] || '-'}</td>
                                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{d['Date'] ? new Date(d['Date']).toLocaleDateString('en-IN') : '-'}</td>
                                <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>{Number(d['Amount']).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
        })}
      </div>
    </div>
  );
}
