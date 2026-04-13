import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Settings, 
  Lock, 
  Server, 
  Mail, 
  Database, 
  ShieldCheck, 
  Save, 
  Activity,
  ChevronRight,
  RefreshCcw,
  Clock,
  HardDrive,
  Trash2,
  Plus,
  Users,
  Eye,
  EyeOff,
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';


export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Account');
  const [gmailStatus, setGmailStatus] = useState({ connected: false, email: null });
  const [loading, setLoading] = useState(true);
  const [delay, setDelay] = useState(3);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchGmailStatus = async () => {
    try {
      const res = await api.get('/settings/gmail');
      setGmailStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch Gmail status', err);
    }
  };


  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchGmailStatus();
      setLoading(false);
    };
    init();
  }, [refreshKey]);

  const handleDisconnectGmail = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Gmail account?')) return;
    try {
      const res = await api.delete('/settings/gmail');
      if (res.data.success) {
        toast.success('Gmail Disconnected');
        fetchGmailStatus();
      }
    } catch (err) {
      toast.error('Failed to disconnect Gmail');
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Configuration</h1>
          <p className="text-slate-500 text-sm mt-1">Manage global security protocols, SMTP throttling, and infrastructure health.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 px-6">
          <Save size={18} />
          Sync All Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {['Security', 'Automation', 'Infrastructure', 'Account'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === tab 
                  ? "bg-white text-slate-900 border border-slate-200 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              {tab}
            </button>
          ))}
        </div>        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {activeTab === 'Security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="card">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <Lock className="text-primary-600" size={20} />
                  <h3 className="font-bold text-slate-800">Authentication Policy</h3>
                </div>
                <div className="p-6 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Master Admin Passphrase</label>
                        <input 
                          type="password"
                          placeholder="••••••••••••"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upload Clearance Password</label>
                        <input 
                          type="password"
                          placeholder="••••••••••••"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none"
                        />
                      </div>
                   </div>
                   <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                      <ShieldCheck className="text-amber-600 shrink-0" size={20} />
                      <p className="text-xs text-amber-700 font-medium leading-relaxed">
                        Security keys are required for all broad-registry updates and SMTP transmissions. Rotate passwords every 90 days for optimal compliance.
                      </p>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Automation' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="card">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <Clock className="text-primary-600" size={20} />
                  <h3 className="font-bold text-slate-800">SMTP Throttling Logic</h3>
                </div>
                <div className="p-6">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <label className="text-sm font-bold text-slate-700">Minimum Broadcast Delay</label>
                         <span className="text-sm font-bold text-primary-600 tabular-nums px-3 py-1 bg-primary-50 rounded-lg">{delay}s</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={delay}
                        onChange={(e) => setDelay(e.target.value)}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      />
                      <p className="text-[11px] text-slate-500 italic font-medium">Throttling prevents mail servers from flagging automated traffic as spam. Recommended: 3s</p>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Infrastructure' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="card p-6 flex items-center gap-6">
                    <div className="p-4 bg-green-50 text-green-600 rounded-2xl border border-green-100 shadow-sm">
                       <Database size={32} />
                    </div>
                    <div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Database Cluster</div>
                       <div className="text-lg font-black text-slate-900 leading-none mb-1">MongoDB Cloud</div>
                       <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] font-black text-green-700 uppercase tracking-tight">V4.2 • Verified State</span>
                       </div>
                    </div>
                 </div>

                 <div className="card p-6 flex items-center gap-6">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
                       <Server size={32} />
                    </div>
                    <div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Backend Runtime</div>
                       <div className="text-lg font-black text-slate-900 leading-none mb-1">Node.js Node-18</div>
                       <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">Active • VPC-East-1</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="card">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <Activity size={18} className="text-primary-600" />
                       Real-time Health Metrics
                    </h3>
                    <button className="text-[10px] font-black text-slate-400 flex items-center gap-1 hover:text-primary-600 uppercase tracking-widest transition-colors">
                       <RefreshCcw size={12} /> Force Diagnostic
                    </button>
                 </div>
                 <div className="p-6 space-y-6">
                    <div className="space-y-4">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memory Allocation</span>
                          <span className="text-xs font-black text-slate-900 tabular-nums">312MB / 1024MB</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-600 rounded-full shadow-sm" style={{ width: '31%' }} />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage Cluster Load</span>
                          <span className="text-xs font-black text-slate-900 tabular-nums">0.8GB / 2GB</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full shadow-sm" style={{ width: '40%' }} />
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'Account' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="card">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                       <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Globe size={18} className="text-primary-600" />
                        Google Cloud Infrastructure
                       </h3>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">High-priority Enterprise Gmail API Connection</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Google OAuth Section */}
                    <div className={cn(
                      "p-6 rounded-2xl space-y-4 mb-6 transition-all",
                      gmailStatus.connected ? "bg-green-50/50 border border-green-100" : "bg-blue-50/50 border border-blue-100"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-2.5 bg-white border rounded-lg shadow-sm",
                            gmailStatus.connected ? "text-green-600 border-green-100" : "text-blue-600 border-blue-100"
                          )}>
                            <Globe size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">Google Cloud (Gmail API)</div>
                            {gmailStatus.connected ? (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-green-600 font-black uppercase tracking-widest">{gmailStatus.email}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              </div>
                            ) : (
                              <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Enterprise-grade secure connection</div>
                            )}
                          </div>
                        </div>
                        
                        {gmailStatus.connected ? (
                          <button 
                            onClick={handleDisconnectGmail}
                            className="px-4 py-2 text-xs font-bold text-red-600 bg-white border border-red-100 hover:bg-red-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Disconnect Account
                          </button>
                        ) : (
                          <a 
                            href={`${window.location.origin.includes('localhost') ? 'http://localhost:5001' : ''}/api/auth/google`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary bg-blue-600 hover:bg-blue-700 border-none shadow-md shadow-blue-100 flex items-center gap-2 px-6 h-10"
                          >
                            <Lock size={16} />
                            Connect Gmail
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {gmailStatus.connected 
                          ? "ZenTrack is currently using this Gmail account for high-priority dispatch. All reconciliations will be routed through the Gmail API."
                          : "Using the Gmail API is recommended for high-priority volumes. It provides better deliverability and more robust encryption than standard SMTP."}
                      </p>
                    </div>
                    </div>
                </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
