import React from 'react';
import toast from 'react-hot-toast';
import { downloadSkipCsv, triggerDownload } from '../services/api';
import { Download, AlertCircle } from 'lucide-react';

export default function SkippedParties({ skips, matchedCount }) {
  const total = matchedCount + skips.length;
  const successRate = total > 0 ? ((matchedCount / total) * 100).toFixed(1) : '0.0';

  // Group skips by reason
  const reasonMap = {};
  skips.forEach(line => {
    const reason = line.includes(' — ') ? line.split(' — ')[1] : 'Unknown reason';
    reasonMap[reason] = (reasonMap[reason] || 0) + 1;
  });

  const handleDownload = async () => {
    try {
      const res = await downloadSkipCsv(skips);
      triggerDownload(res.data, 'skipped_parties.csv');
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <div className="skipped-section">
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-num">{skips.length}</div>
          <div className="metric-label">Total Skipped</div>
        </div>
        <div className="metric-card green">
          <div className="metric-num">{matchedCount}</div>
          <div className="metric-label">Processed</div>
        </div>
        <div className="metric-card blue">
          <div className="metric-num">{successRate}%</div>
          <div className="metric-label">Success Rate</div>
        </div>
      </div>

      <div className="skip-reasons">
        {Object.entries(reasonMap).map(([reason, count], i) => (
          <div key={i} className="alert alert-warning">
            <AlertCircle size={16} />
            <span><strong>{count} {count === 1 ? 'party' : 'parties'}:</strong> {reason}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary" onClick={handleDownload}>
        <Download size={16} /> Download Skip List (CSV)
      </button>
    </div>
  );
}
