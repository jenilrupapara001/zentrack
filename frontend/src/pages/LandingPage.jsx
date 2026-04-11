import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Zap, 
  Bot, 
  BarChart3, 
  FileCheck2, 
  Mail, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Lock,
  Globe,
  Database,
  Terminal,
  Server,
  Workflow
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, badge }) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-card hover:shadow-premium group transition-all duration-500 hover:-translate-y-1">
    <div className="flex justify-between items-start mb-6">
      <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-sm">
        <Icon size={24} />
      </div>
      {badge && (
        <span className="text-[9px] font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-full uppercase tracking-widest">{badge}</span>
      )}
    </div>
    <h3 className="text-lg font-black text-slate-900 mb-3 tracking-tight uppercase">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-[13px] font-medium">{description}</p>
  </div>
);

const TrustPill = ({ text }) => (
  <div className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{text}</span>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Precision Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
               <FingerprintLogo />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">ZenTrack</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
             <a href="#features" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:text-primary-600 transition-colors">Features</a>
             <a href="#security" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:text-primary-600 transition-colors">Security</a>
             <a href="#integration" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:text-primary-600 transition-colors">Integration</a>
          </div>

          <Link 
            to="/login" 
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
          >
            Access Console
          </Link>
        </div>
      </nav>

      {/* Industrial Hero Section */}
      <section className="pt-40 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
             <span className="flex items-center gap-1.5 text-[9px] font-black text-green-600">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               SYSTEM ONLINE
             </span>
             <div className="w-px h-3 bg-slate-200" />
             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">v4.0 Enterprise Deployment</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000">
             RECONCILIATION <br/> <span className="text-primary-600 underline decoration-slate-200 underline-offset-8">AT SCALE.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-500 text-lg md:text-xl font-medium leading-relaxed opacity-80">
            ZenTrack orchestrates automated payment clustering and statement dispatch with industrial precision. Eliminate manual Excel bottlenecks and restore operational balance.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 items-center justify-center pt-4">
             <Link to="/login" className="px-10 py-5 bg-primary-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary-200 hover:scale-105 transition-all active:scale-95 flex items-center gap-3 group">
                Initialize Deployment
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </Link>
             <button className="px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-3xl font-black text-sm uppercase tracking-widest hover:border-slate-400 transition-all">
                View Documentation
             </button>
          </div>

          <div className="pt-20 flex flex-wrap justify-center gap-4 animate-in fade-in duration-1000 delay-500">
             <TrustPill text="SSL Encrypted" />
             <TrustPill text="Vault Isolation" />
             <TrustPill text="Auto-Audit Trails" />
             <TrustPill text="OAuth2 Protocol" />
          </div>
        </div>
      </section>

      {/* Feature Architecture */}
      <section id="features" className="py-32 bg-white border-y border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-50 rounded-full blur-[120px] opacity-30 -mr-64 -mt-64" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.4em]">Core Architecture</span>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none uppercase">Platform <br/> Engineering.</h2>
            </div>
            <p className="max-w-md text-slate-500 font-medium italic">Bypassing manual entry via high-performance transaction clustering and automated dispatch pipelines.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Bot}
              title="Identity Clustering"
              description="Our engine automatically groups fragmented transaction rows into verified party entities using historical pattern matching."
              badge="Neural"
            />
            <FeatureCard 
              icon={Workflow}
              title="Mission Pipelines"
              description="Guided step-by-step onboarding ensures every operator follows the exact same verification protocol every time."
              badge="Guided"
            />
            <FeatureCard 
              icon={Globe}
              title="Global SMTP Routing"
              description="Dispatch reconciliation statements through multiple secure corporate identities with built-in rate throttling."
              badge="Scale"
            />
            <FeatureCard 
              icon={Terminal}
              title="Raw Telemetry"
              description="Access detailed execution logs for every broadcast. Track deliverability, latency, and node health in real-time."
              badge="Audit"
            />
            <FeatureCard 
              icon={Database}
              title="Registry Persistence"
              description="Your party communication registry grows intelligently with every reconciliation, learning and storing new mapped identities."
              badge="Self-Healing"
            />
            <FeatureCard 
              icon={Server}
              title="Industrial Hosting"
              description="Optimized MERN architecture designed for high-concurrency batch processing and data-intensive analysis."
              badge="Infrastructure"
            />
          </div>
        </div>
      </section>

      {/* Security Deep Dive */}
      <section id="security" className="py-32 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
             <div className="space-y-4">
                <div className="w-16 h-1 bg-primary-500 rounded-full" />
                <h2 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase italic">Security is the <br/> <span className="text-primary-500">Foundation.</span></h2>
             </div>
             <p className="text-slate-400 text-lg leading-relaxed font-medium">
                ZenTrack is engineered with a 'Zero Trust' mentality. Your financial data and SMTP credentials never leave the encrypted vault except for authorized transmission.
             </p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                   <Lock className="text-primary-400" size={24} />
                   <h4 className="font-bold text-sm uppercase tracking-widest text-white">AES-256 Encryption</h4>
                   <p className="text-[11px] text-slate-500 font-medium">Industry standard encryption for all sensitive credential storage.</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                   <ShieldCheck className="text-primary-400" size={24} />
                   <h4 className="font-bold text-sm uppercase tracking-widest text-white">Identity Protection</h4>
                   <p className="text-[11px] text-slate-500 font-medium">Dual-credential authentication for all administrative operators.</p>
                </div>
             </div>
          </div>
          <div className="relative flex items-center justify-center">
             <div className="w-80 h-80 bg-primary-500/20 rounded-full blur-[100px] absolute animate-pulse" />
             <div className="w-64 h-64 border-[1px] border-primary-500/30 rounded-full animate-[spin_20s_linear_infinite] flex items-center justify-center p-8">
                <div className="w-48 h-48 border-[1px] border-primary-500/50 rounded-full animate-[spin_10s_linear_infinite_reverse] flex items-center justify-center p-8">
                   <ShieldCheck size={64} className="text-primary-500" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section id="integration" className="py-32 bg-slate-50 border-b border-slate-200">
         <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Enterprise Integrations</h2>
            <p className="text-slate-500 font-medium max-w-xl mx-auto text-sm">Synchronize your existing financial workflows with our high-fidelity processing node.</p>
            
            <div className="pt-10 flex flex-wrap justify-center gap-10 items-center opacity-40 grayscale">
               <div className="flex items-center gap-2">
                  <span className="font-black text-xl italic uppercase">GMAIL</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="font-black text-xl italic uppercase">OUTLOOK</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="font-black text-xl italic uppercase">AWS SES</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="font-black text-xl italic uppercase">NODE.JS</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="font-black text-xl italic uppercase">XLSX_ENGINE</span>
               </div>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
         <div className="max-w-5xl mx-auto bg-slate-900 rounded-[50px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-slate-300">
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent" />
            <div className="relative z-10 space-y-10">
               <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">RESTORE THE <span className="text-primary-500">BALANCE.</span></h2>
               <p className="text-slate-400 max-w-lg mx-auto font-medium">Join forward-thinking finance teams scaling their operations with ZenTrack Alpha.</p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/login" className="px-12 py-5 bg-white text-slate-900 rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl">Start Free Access</Link>
                  <button className="px-12 py-5 bg-slate-800 text-white rounded-3xl font-black text-sm uppercase tracking-widest border border-slate-700 hover:bg-slate-700 transition-all">Request Enterprise Key</button>
               </div>
            </div>
         </div>
      </section>

      {/* Detailed Footer */}
      <footer className="py-20 bg-white border-t border-slate-100">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-slate-100 pb-20 mb-12">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                     <FingerprintLogo />
                  </div>
                  <span className="text-md font-black text-slate-900 uppercase tracking-tighter">ZenTrack</span>
               </div>
               <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">High-fidelity reconciliation & identity management for global supply chains.</p>
            </div>
            
            <div className="space-y-4">
               <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Platform</h5>
               <ul className="space-y-2">
                  <li><Link to="/login" className="text-[11px] text-slate-500 font-bold hover:text-primary-600 transition-colors uppercase tracking-widest">Dashboard</Link></li>
                  <li><Link to="/login" className="text-[11px] text-slate-500 font-bold hover:text-primary-600 transition-colors uppercase tracking-widest">Reconciliation</Link></li>
                  <li><Link to="/login" className="text-[11px] text-slate-500 font-bold hover:text-primary-600 transition-colors uppercase tracking-widest">Registry</Link></li>
               </ul>
            </div>

            <div className="space-y-4">
               <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Technical</h5>
               <ul className="space-y-2">
                  <li><a href="#" className="text-[11px] text-slate-500 font-bold hover:text-primary-600 transition-colors uppercase tracking-widest">API Docs</a></li>
                  <li><a href="#" className="text-[11px] text-slate-500 font-bold hover:text-primary-600 transition-colors uppercase tracking-widest">Node Status</a></li>
                  <li><a href="#" className="text-[11px] text-slate-500 font-bold hover:text-primary-600 transition-colors uppercase tracking-widest">Changelog</a></li>
               </ul>
            </div>

            <div className="space-y-4">
               <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Infrastructure</h5>
               <div className="flex gap-2 items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Cluster-01 Active</span>
               </div>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-6 text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            © 2024 ZenTrack Solutions • High-Fidelity Financial Automation • Secure Operational Technology
         </div>
      </footer>
    </div>
  );
}

const FingerprintLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10v4" />
    <path d="M14 10h.01" />
    <path d="M10 10h.01" />
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
