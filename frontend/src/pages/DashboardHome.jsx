import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock as ClockIcon,
  AlertCircle,
  History,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { getDashboardStats } from '../services/api';
import { useRefresh } from '../context/RefreshContext';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

const StatCard = ({ label, value, icon: Icon, trend, colorClass }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card hover:shadow-premium transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-500", colorClass, "bg-opacity-10")}>
        <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
      </div>
      {trend !== undefined && (
        <div className={cn(
          "flex items-center text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider",
          trend >= 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
        )}>
          {trend >= 0 ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="text-3xl font-black text-slate-900 mb-1 tabular-nums tracking-tight">{value}</div>
    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">{label}</div>
  </div>
);

export default function DashboardHome() {
  const { refreshKey } = useRefresh();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data.data);
      } catch (err) {
        console.error("Stats fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [refreshKey]);

  if (loading || !stats) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-40 gap-6 animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-16 h-16 border-[3px] border-slate-100 border-t-primary-600 rounded-full animate-spin" />
          <Zap className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-primary-600 animate-pulse" size={24} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Aggregating Data</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Global Telemetry Stream v4.0</p>
        </div>
      </div>
    );
  }

  const { kpis, chartData, recentActivity } = stats;
  const isNewUser = kpis.totalParties === 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header with Precision Branding */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-[2px] w-8 bg-primary-600 rounded-full" />
            <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em]">Operational Status: Active</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Intelligence</h1>
          <p className="text-slate-500 text-[13px] font-medium mt-1 uppercase tracking-wide opacity-70">Real-time performance metrics & automation health</p>
        </div>

        {/* Verification Badge */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-2xl text-white shadow-xl">
          <ShieldCheck size={18} className="text-primary-400" />
          <div className="text-[10px] font-bold uppercase tracking-widest leading-none">
            Encrypted Node<br />
            <span className="text-slate-500 font-medium">Cluster Alpha</span>
          </div>
        </div>
      </div>

      {/* Strategic Onboarding for New Users */}
      {isNewUser && (
        <div className="bg-gradient-to-br from-primary-600 to-blue-700 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-black mb-3 italic tracking-tight uppercase">Strategic Initialization Required</h2>
              <p className="text-blue-100 text-[15px] font-medium leading-relaxed opacity-90">
                Welcome to ZenTrack. Your communication registry is currently offline.
                Initialize your identity mapping protocol to begin automated payment reconciliation.
              </p>
            </div>
            <button
              onClick={() => navigate('/parties')}
              className="bg-white text-primary-700 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl active:scale-95 shrink-0"
            >
              Start Initialization
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* KPI Section with Precision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Parties"
          value={kpis.totalParties.toLocaleString()}
          icon={Users}
          trend={0}
          colorClass="bg-blue-600"
        />
        <StatCard
          label="Success Rate"
          value={`${kpis.successRate}`}
          icon={CheckCircle2}
          trend={0}
          colorClass="bg-green-600"
        />
        <StatCard
          label="Pending Queue"
          value={kpis.pendingQueue}
          icon={ClockIcon}
          trend={0}
          colorClass="bg-amber-600"
        />
        <StatCard
          label="Critical Failures"
          value={kpis.criticalFailures}
          icon={AlertCircle}
          trend={0}
          colorClass="bg-red-600"
        />
      </div>

      {/* Charts Section with Premium Styling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-card h-[450px] flex flex-col group">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase text-xs tracking-[0.2em]">
                <History size={16} className="text-primary-600" />
                Transmission History
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Protocol dispatch latency over time</p>
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest">7D Window</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="sent"
                  stroke="#2563eb"
                  strokeWidth={4}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
                  animationDuration={2000}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-card h-[450px] flex flex-col mt-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase text-xs tracking-[0.2em]">
                <TrendingUp size={16} className="text-primary-600" />
                Processing Volume
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Automated reconciliation batch density</p>
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest">Active nodes</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc', radius: 12 }}
                  contentStyle={{
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="processed" radius={[8, 8, 8, 8]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Table with High-Precision Styling */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-card overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Recent Transmission Stream</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Live telemetry from protocol nodes</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900 text-green-400 rounded-full border border-green-800 text-[9px] font-black tracking-widest uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live Feed
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Entity Context</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Comm Channel</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Protocol Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Node ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-24 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                      <History size={32} className="text-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-black text-slate-900 uppercase tracking-widest italic">No Data Stream Detected</div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Connect to a live dispatch batch to view telemetry</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentActivity.map((log, i) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-all duration-300 group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 tracking-tight">{log.partyName}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{log.partyCode}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[11px] font-bold text-slate-500 lowercase tracking-tight italic">
                          {log.emails[0]}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={cn(
                        "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                        log.status === 'SENT'
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-100"
                          : "text-rose-700 bg-rose-50 border border-rose-100"
                      )}>
                        {log.status === 'SENT' ? 'Success' : 'Failure'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-mono text-[10px] font-bold text-slate-400 tabular-nums">
                      {log.sessionId.slice(-12).toUpperCase()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Integrity Footer */}
      <div className="flex items-center justify-center gap-8 py-4 opacity-30 grayscale hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-2">
          <div className="w-1 h-8 bg-slate-300 rounded-full" />
          <div className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase underline decoration-2">Auto-Audit 2026</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-8 bg-slate-300 rounded-full" />
          <div className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase underline decoration-2">Protocol Verified</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-8 bg-slate-300 rounded-full" />
          <div className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase underline decoration-2">Node Secure</div>
        </div>
      </div>
    </div>
  );
}
