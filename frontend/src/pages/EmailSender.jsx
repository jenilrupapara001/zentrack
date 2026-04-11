import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Mail,
  KeyRound,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  Globe,
  ShieldCheck,
  AlertCircle,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  ChevronDown,
  Loader2,
  Settings,
  Plus
} from 'lucide-react';
import {
  getSmtpCredentials,
  sendEmails,
  downloadEmailLogTxt,
  downloadEmailLogExcel,
  triggerDownload,
  getSessionById
} from '../services/api';
import { useRefresh } from '../context/RefreshContext';

export default function EmailSender({ matchedResults: propResults }) {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const { refreshKey } = useRefresh();

  const [creds, setCreds] = useState([]);
  const [selectedSmtpId, setSelectedSmtpId] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(false);

  // Determine active results
  const activeResults = sessionData?.matchedResults || propResults || [];

  useEffect(() => {
    fetchInitialData();
  }, [sessionId, refreshKey]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [credsRes, sessionRes] = await Promise.all([
        getSmtpCredentials(),
        sessionId ? getSessionById(sessionId) : Promise.resolve({ data: { success: true, data: null } })
      ]);

      const list = credsRes.data.data;
      setCreds(list);
      if (list.length > 0) setSelectedSmtpId(list[0]._id);

      if (sessionRes.data.data) {
        setSessionData(sessionRes.data.data);
      }
    } catch {
      toast.error('Could not initialize dispatch context');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBatch = async () => {
    if (!selectedSmtpId) return toast.error('Select a sending identity');
    if (!activeResults.length) return toast.error('No results to broadcast');
    if (!window.confirm(`ZenTrack will now broadcast ${activeResults.length} reconciliation emails. Proceed?`)) return;

    setSending(true);
    const toastId = toast.loading('Establishing Secure SMTP Handshake...');
    try {
      const res = await sendEmails({
        smtpId: selectedSmtpId,
        matchedResults: activeResults
      });
      setSessionData(prev => ({ ...prev, results: res.data.data }));
      toast.success('Broadcast Complete', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transmission error', { id: toastId });
    } finally {
      setSending(false);
    }
  };

  // Helper for results display
  const sendOutcome = sessionData?.results;

  // Data for preview if no results are active
  const previewData = {
    to: activeResults[0]?.emails?.[0] || 'finance@zen-track.com',
    subject: `Payment Reconciliation Statement - ${activeResults[0]?.partyCode || 'ZenTrack Sample Entity'}`,
    body: `Dear Team,\n\nPlease find attached the payment reconciliation statement for the recent transactions. \n\nTotal Settled: ${activeResults[0]?.totalSettled || '₹4,50,000.00'}\nRecords: ${activeResults[0]?.payments?.length || 12}\n\nPlease acknowledge receipt.`
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Automation Dispatch</h1>
        <p className="text-slate-500 text-sm mt-1">Configure secure SMTP routing and broadcast reconciliation statements to verified entities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Credentials */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <ShieldCheck size={18} className="text-primary-600" />
              SMTP Routing Identity
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Profile</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    value={selectedSmtpId}
                    onChange={e => setSelectedSmtpId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none appearance-none"
                  >
                    {creds.length === 0 ? (
                      <option value="">No Accounts Configured</option>
                    ) : (
                      creds.map(c => (
                        <option key={c._id} value={c._id}>{c.label} ({c.user})</option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="pt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Security Protocol</div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Lock size={12} className="text-green-600" /> AES-256 Vault-backed storage
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4">
            <Clock className="text-blue-600 shrink-0" size={20} />
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">Smart Throttling</div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                To ensure 100% deliverability, we inject 1-5s random delays between broadcasts to avoid SMTP rate-limiting.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Preview & Action */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card flex flex-col h-full min-h-[500px]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs font-bold text-slate-500 ml-2">Transmission Preview</span>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs font-bold text-primary-600 hover:text-primary-700"
              >
                {showPreview ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex flex-col gap-2 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase w-12">To:</span>
                    <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{previewData.to}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase w-12">Sub:</span>
                    <span className="text-sm font-bold text-slate-900">{previewData.subject}</span>
                  </div>
                </div>

                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                  {previewData.body}
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <FileSpreadsheet className="text-green-600" size={24} />
                    <div>
                      <div className="text-xs font-bold text-slate-900">payment_advice_apex_mf.xlsx</div>
                      <div className="text-[10px] text-slate-500">Document generated from Cluster-824</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100">
              {sendOutcome ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="text-xs font-bold text-primary-600 uppercase tracking-widest">
                      Transmission Report
                    </div>
                    <div className="text-xs font-bold text-slate-500 tabular-nums">
                      100%
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                      <CheckCircle size={14} /> {sendOutcome.sentCount} DELIVERED
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                      <XCircle size={14} /> {sendOutcome.failedCount} FAILED
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleSendBatch}
                    disabled={sending || !activeResults.length}
                    className="btn-primary w-full max-w-sm h-12 flex items-center justify-center gap-3 shadow-lg shadow-primary-200"
                  >
                    {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    {sending ? 'Broadcasting Batch...' : 'Commit & Broadcast Batch'}
                  </button>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Requires established clusters from the Reconciliation Engine.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
