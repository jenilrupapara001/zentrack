import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { login } from '../services/api';
import { 
  Lock, 
  User, 
  ShieldCheck, 
  Activity, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function LoginPage({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      return toast.error('Please enter all security credentials');
    }
    
    setLoading(true);
    try {
      await login(formData);
      toast.success('Identity Verified. Accessing Registry...');
      onLogin();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-30" />
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary-100/40 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-blue-100/40 rounded-full blur-[100px] animate-pulse" />

      <div className="w-full max-w-[400px] px-4 relative z-10">
        <div className="bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-200/60 p-10 backdrop-blur-sm">
          
          {/* Organization Branding */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-[0_12px_24px_-8px_rgba(37,99,235,0.4)]">
              <Fingerprint size={28} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Enterprise Identity</h1>
            <p className="text-[13px] font-medium text-slate-500 mt-2">ZenTrack Workforce Management Console</p>
            
            {/* Cold Start Indicator */}
            <div className="mt-4 flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-50 rounded-full border border-slate-100 animate-in fade-in duration-1000">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Backend Uplink Active</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] px-1">Operator Identity</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 rounded-2xl text-[14px] transition-all outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] px-1">Security Passphrase</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 rounded-2xl text-[14px] transition-all outline-none tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Verification Status */}
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                <ShieldCheck size={12} /> SSL ENCRYPTED
              </div>
              <button type="button" className="text-[10px] font-bold text-primary-600 hover:underline">Trouble logging in?</button>
            </div>

            {/* Submit Control */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl shadow-slate-200 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Verify Credentials
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Infrastructure Health */}
          <div className="mt-10 pt-10 border-t border-slate-100 flex items-center justify-center gap-6 opacity-40 grayscale">
            <div className="flex flex-col items-center gap-1">
              <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Registry</div>
              <div className="h-0.5 w-4 bg-slate-300 rounded-full" />
            </div>
            <div className="flex flex-col items-center gap-1 border-x border-slate-100 px-6">
              <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">SMTP Cloud</div>
              <div className="h-0.5 w-4 bg-slate-300 rounded-full" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Cluster</div>
              <div className="h-0.5 w-4 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>

        {/* Legal/Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Supply Chain Solutions</p>
          <div className="flex items-center justify-center gap-4 mt-2">
             <span className="text-[9px] text-slate-400 font-medium">Compliance v4</span>
             <span className="w-1 h-1 bg-slate-200 rounded-full" />
             <span className="text-[9px] text-slate-400 font-medium">Auto-Sync Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
