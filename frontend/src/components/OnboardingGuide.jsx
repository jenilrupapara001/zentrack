import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Users, 
  Settings, 
  FileSpreadsheet, 
  History, 
  X, 
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const steps = [
    {
      title: "Identity Mapping",
      desc: "Import your party code and email registry.",
      path: "/parties",
      icon: Users
    },
    {
      title: "Protocol Config",
      desc: "Setup SMTP credentials in settings.",
      path: "/settings",
      icon: Settings
    },
    {
      title: "Reconciliation",
      desc: "Upload payment sheets for automated clustering.",
      path: "/reconciliation",
      icon: FileSpreadsheet
    },
    {
      title: "Audit Loop",
      desc: "Verify transmission logs and audit trails.",
      path: "/logs",
      icon: History
    }
  ];

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-premium hover:scale-110 transition-all z-50 group border border-slate-700"
    >
      <Compass size={20} className="group-hover:rotate-12 transition-transform" />
    </button>
  );

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-3xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12)] border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Compass size={18} className="text-primary-400" />
          <span className="text-[13px] font-bold tracking-tight">Mission Command</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">Initialization Checklist</p>
        
        {steps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => navigate(step.path)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all group text-left border border-transparent hover:border-slate-100"
          >
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
              <step.icon size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-[12px] font-bold text-slate-900">{step.title}</h4>
              <p className="text-[10px] text-slate-500 leading-tight">{step.desc}</p>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-400 transition-colors" />
          </button>
        ))}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 italic">
        <p className="text-[9px] text-slate-400 text-center font-medium">Follow these steps to synchronize your first batch.</p>
      </div>
    </div>
  );
}
