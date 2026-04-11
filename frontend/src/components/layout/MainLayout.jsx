import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Send,
  History,
  Settings,
  Search,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Activity,
  RefreshCcw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRefresh } from '../../context/RefreshContext';
import OnboardingGuide from '../OnboardingGuide';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileSpreadsheet, label: 'Reconciliation', path: '/reconciliation' },
  { icon: Users, label: 'Parties', path: '/parties' },
  { icon: Send, label: 'Email Sender', path: '/sender' },
  { icon: History, label: 'Logs & Reports', path: '/logs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function MainLayout({ onLogout }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const currentPath = location.pathname;
  const { triggerRefresh } = useRefresh();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-30",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-bottom border-slate-100 mb-4 bg-white sticky top-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-lg text-white shadow-sm">
              <Activity size={20} />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg tracking-tight text-slate-900 truncate">
                ZenTrack
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                isActive
                  ? "bg-primary-50 text-primary-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={20} className={cn(
                "flex-shrink-0 transition-colors",
                currentPath === item.path ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              {isSidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-900 transition-colors w-full"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            {isSidebarOpen && <span className="text-sm font-medium">Collapse</span>}
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <User size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex-1 max-w-xl flex items-center gap-3">
            <div className="relative group flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search party code, invoice, or status..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none"
              />
            </div>
            
            <button 
              onClick={triggerRefresh}
              className="p-2.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl border border-slate-200 transition-all flex items-center gap-2 group"
              title="Refresh Application Data"
            >
              <RefreshCcw size={18} className="group-active:rotate-180 transition-transform duration-500" />
              <span className="text-xs font-bold hidden lg:inline">Sync</span>
            </button>
          </div>

          <div className="flex items-center gap-4 ml-4">
            {/* System Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Systems Online</span>
            </div>

            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
            </button>

            <div className="h-8 w-px bg-slate-200 mx-1" />

            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">Admin User</div>
                <div className="text-xs text-slate-500">Finance Team</div>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Onboarding Control */}
      <OnboardingGuide />
    </div>
  );
}
