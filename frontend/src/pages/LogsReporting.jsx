import React, { useState, useEffect } from 'react';
import { showToast } from '../components/CustomToast';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  ExternalLink,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { 
  downloadEmailLogTxt, 
  downloadEmailLogExcel, 
  triggerDownload, 
  getEmailLogs,
  retryEmails
} from '../services/api';
import { useRefresh } from '../context/RefreshContext';

export default function LogsReporting() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const { refreshKey } = useRefresh();
  const [lastFetched, setLastFetched] = useState(new Date());

  useEffect(() => {
    fetchLogs();
    
    // Polling logic for "real-time" updates
    let interval;
    if (isLive) {
      interval = setInterval(() => {
        pollLogs();
      }, 3000);
    }
    
    // Refresh on window focus
    const handleFocus = () => {
      pollLogs();
    };
    
    // Refresh on page visibility
    const handleVisibility = () => {
      if (!document.hidden) {
        pollLogs();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshKey, isLive]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getEmailLogs();
      setLogs(res.data.data || []);
      setLastFetched(new Date());
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to retrieve logs', duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const pollLogs = async () => {
    try {
      const res = await getEmailLogs();
      setLogs(res.data.data || []);
      setLastFetched(new Date());
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  const handleRetrySingle = async (logId) => {
    setRetrying(logId);
    try {
      const res = await retryEmails([logId]);
      if (res.data.success) {
        showToast({ type: 'success', title: '✅ Retry Success!', message: 'Email resent successfully', duration: 4000 });
        await fetchLogs();
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: err.response?.data?.message || err.message, duration: 5000 });
    } finally {
      setRetrying(null);
    }
  };

  const handleTxt = async () => {
    try {
      const res = await downloadEmailLogTxt();
      triggerDownload(res.data, 'ZenTrack_Audit_Log.txt');
    } catch {
      showToast({ type: 'warning', title: 'Warning', message: 'Log trace not generated yet', duration: 3000 });
    }
  };

  const handleExcel = async () => {
    try {
      const res = await downloadEmailLogExcel();
      triggerDownload(res.data, 'ZenTrack_Analytical_Report.xlsx');
    } catch {
      showToast({ type: 'warning', title: 'Warning', message: 'Report context missing', duration: 3000 });
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = (log.partyName || '').toLowerCase().includes(search.toLowerCase()) || 
                         (log.partyCode || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || 
                         (statusFilter === 'Success' && log.status === 'SENT') ||
                         (statusFilter === 'Failed' && log.status === 'FAILED');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Intelligence & Audit Trail</h1>
          <p className="text-slate-500 text-sm mt-1">Cross-session historical logs and delivery analytics for audit compliance.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleTxt} className="btn-secondary flex items-center gap-2">
            <FileText size={18} />
            Raw Log
          </button>
          <button onClick={handleExcel} className="btn-primary flex items-center gap-2">
            <FileSpreadsheet size={18} />
            Data Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Query logs by entity or email..."
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border-transparent focus:bg-white focus:border-primary-500 rounded-lg text-sm transition-all outline-none"
                />
             </div>
             <div className="h-6 w-px bg-slate-200" />
             <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select 
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
                >
                  <option>All Status</option>
                  <option>Success</option>
                  <option>Failed</option>
                </select>
             </div>
             <div className="h-6 w-px bg-slate-200" />
             <div className="flex items-center gap-3 pr-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  {isLive ? 'Live Monitoring' : 'Monitoring Paused'}
                </span>
<button 
                  onClick={() => setIsLive(!isLive)}
                  className="text-[10px] font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4"
                >
                  {isLive ? 'Pause' : 'Resume'}
                </button>
                <button 
                  onClick={() => {
                    fetchLogs();
                  }}
                  className="text-[10px] font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4"
                >
                  Refresh
                </button>
              </div>
           </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transaction Time</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Entity</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Outcome</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Diagnostic Info</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Rethrow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-20 text-center">
                           <div className="flex flex-col items-center gap-3">
                              <Loader2 className="animate-spin text-primary-600" size={32} />
                              <p className="text-sm font-bold text-slate-500">Querying intelligence vault...</p>
                           </div>
                        </td>
                      </tr>
                    ) : filteredLogs.map(log => (
                      <tr key={log.id || log._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 text-xs font-medium text-slate-400 tabular-nums">
                           {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-sm font-bold text-slate-900">{log.partyName || log.partyCode}</div>
                           <div className="text-[10px] font-medium text-slate-500">
                             {Array.isArray(log.emails) ? log.emails.join(', ') : log.emails}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                             log.status === 'SENT' ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'
                           }`}>
                             {log.status === 'SENT' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                             {log.status === 'SENT' ? 'SUCCESS' : 'FAILED'}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className={`text-xs font-medium truncate max-w-[200px] ${log.status === 'FAILED' ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                             {log.error || '-'}
                           </div>
                        </td>
<td className="px-6 py-4 text-right">
                            {log.status === 'FAILED' && (
                              <button 
                                onClick={() => handleRetrySingle(log.id || log._id)}
                                disabled={retrying === (log.id || log._id)}
                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {retrying === (log.id || log._id) ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                              </button>
                            )}
                         </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="card p-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm">
                <Calendar size={16} className="text-slate-400" />
                Time Filtering
              </h3>
              <div className="space-y-3">
                 <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:border-primary-400 transition-colors">
                    <span className="text-xs font-bold text-slate-900 block">Today</span>
                    <span className="text-[10px] text-slate-500">April 11, 2024</span>
                 </div>
                 <div className="p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-primary-400 transition-colors">
                    <span className="text-xs font-bold text-slate-900 block">Current Quarter</span>
                    <span className="text-[10px] text-slate-500">Jan - Mar 2024</span>
                 </div>
              </div>
           </div>

           <div className="card p-6 border-dashed bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2 text-sm">
                Observability
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                Real-time WebSocket streaming for transmission statuses is enabled. Failures will trigger high-priority alerts in the Topbar.
              </p>
              <button className="text-[11px] font-bold text-primary-600 flex items-center gap-1 hover:underline">
                View Error Schema <ExternalLink size={10} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
