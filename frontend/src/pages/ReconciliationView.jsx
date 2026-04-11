import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  Users, 
  SkipForward, 
  AlertTriangle,
  Search,
  Download,
  Mail,
  ChevronDown,
  ExternalLink,
  ChevronRight,
  Filter,
  FileCheck2,
  XCircle,
  Settings
} from 'lucide-react';
import { 
  uploadReconciliationFiles, 
  downloadPartywiseExcel, 
  triggerDownload,
  getSession
} from '../services/api';
import { cn } from '../lib/utils';
import { useRefresh } from '../context/RefreshContext';

export default function ReconciliationView() {
  const navigate = useNavigate();
  const { refreshKey } = useRefresh();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [syncToDatabase, setSyncToDatabase] = useState(false);

  useEffect(() => {
    setFile(null);
    setResults(null);
  }, [refreshKey]);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await getSession();
        if (res.data.data) {
          setResults(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch session", err);
      }
    };
    fetchLatest();
  }, []);

  // Stats from results
  const summary = results?.summary;
  const matchedData = results?.matchedResults || [];

  const onDrop = useCallback((accepted) => {
    if (accepted.length) {
      setFile(accepted[0]);
      setResults(null);
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
      const res = await uploadReconciliationFiles(file, syncToDatabase);
      if (res.data.success) {
        setResults(res.data.data);
        toast.success(`Processing complete: ${res.data.data.summary.matched} clusters identified.`);
        
        // Redirect to Email Sender after short delay
        setTimeout(() => {
          navigate(`/sender?sessionId=${res.data.data.sessionId}`);
        }, 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadPartywiseExcel();
      triggerDownload(res.data, `PayRecon_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch {
      toast.error('Export failed');
    } finally {
      setDownloading(false);
    }
  };

  const toggleRow = (code) => setExpanded(p => ({ ...p, [code]: !p[code] }));

  const filteredResults = matchedData.filter(r => 
    r.partyCode.toLowerCase().includes(search.toLowerCase()) ||
    r.emails.some(e => e.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reconciliation Engine</h1>
          <p className="text-slate-500 text-sm mt-1">Upload payment sheets to perform automated entity clustering and verification.</p>
        </div>
        {results && (
          <button 
            onClick={handleBulkDownload}
            disabled={downloading}
            className="btn-secondary flex items-center gap-2"
          >
            {downloading ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> : <Download size={18} />}
            Export Processed Data
          </button>
        )}
      </div>

      {/* Upload Zone */}
      <div className="card p-8">
        <div 
          {...getRootProps()} 
          className={cn(
            "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer group",
            isDragActive ? "border-primary-500 bg-primary-50" : "border-slate-200 hover:border-primary-400 hover:bg-slate-50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              "p-4 rounded-full transition-colors",
              file ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400 group-hover:text-primary-600"
            )}>
              {file ? <FileCheck2 size={40} /> : <Upload size={40} />}
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                {file ? file.name : (isDragActive ? 'Drop file to upload' : 'Drag & drop payment sheet')}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {file ? `${(file.size / 1024).toFixed(1)} KB • Ready to process` : 'Strictly supports .XLSX Excel files'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox"
                checked={syncToDatabase}
                onChange={(e) => setSyncToDatabase(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700 group-hover:text-primary-600 transition-colors">Sync to Database</span>
                <span className="text-[10px] text-slate-400 font-medium">Auto-update party registry</span>
            </div>
          </label>

          <button 
            disabled={!file || loading}
            onClick={handleProcess}
            className="btn-primary min-w-[200px] flex items-center justify-center gap-2 h-12 shadow-lg shadow-primary-100 transition-all active:scale-95"
          >
            {loading ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <Settings size={20} />}
            {loading ? 'Processing Machine Learning...' : 'Initiate Reconciliation'}
          </button>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="p-2.5 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={24} /></div>
            <div>
              <div className="text-xl font-bold text-slate-900">{summary.matched}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Matched Entities</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg"><SkipForward size={24} /></div>
            <div>
              <div className="text-xl font-bold text-slate-900">{summary.skipped}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Entries Skipped</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={24} /></div>
            <div>
              <div className="text-xl font-bold text-slate-900">{summary.withoutEmail}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missing Mappings</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
            <div>
              <div className="text-xl font-bold text-slate-900">{matchedData.length}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Clusters</div>
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Reconciliation Results</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search cluster..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:ring-4 focus:ring-primary-50 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredResults.map((entry) => {
              const isOpen = expanded[entry.partyCode];
              return (
                <div key={entry.partyCode} className="card overflow-hidden">
                  <div 
                    onClick={() => toggleRow(entry.partyCode)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("transition-transform", isOpen && "rotate-180")}>
                        <ChevronDown size={18} className="text-slate-400" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                           {entry.partyCode}
                           <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-tighter">Verified Cluster</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail size={12} /> {entry.emails[0]}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-xs text-slate-500 font-medium">{entry.payments.length} Transaction Records</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <div className="text-sm font-bold text-slate-900 tabular-nums">
                            ₹{entry.payments.reduce((acc, curr) => acc + (curr['Bank Payment'] || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settled Amount</div>
                       </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-6">
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inv. No.</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Debit</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Settlement</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {entry.payments.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-xs font-bold text-primary-600">{p['Inv. No.'] || 'N/A'}</td>
                                <td className="px-4 py-3 text-[11px] font-medium text-slate-500">{p['Transaction Type']}</td>
                                <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{p['Pur. Date']}</td>
                                <td className="px-4 py-3 text-xs text-right text-amber-600 tabular-nums">
                                  {p['Debit Amount'] > 0 ? `₹${p['Debit Amount'].toLocaleString('en-IN')}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-xs text-right font-bold text-green-600 tabular-nums">
                                  ₹{p['Bank Payment'].toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
