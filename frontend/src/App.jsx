import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/layout/MainLayout';
import DashboardHome from './pages/DashboardHome';
import ReconciliationView from './pages/ReconciliationView';
import PartyManagement from './pages/PartyManagement';
import EmailSender from './pages/EmailSender';
import LogsReporting from './pages/LogsReporting';
import SettingsPage from './pages/SettingsPage';
import { getAuthStatus } from './services/api';

import { RefreshProvider } from './context/RefreshContext';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getAuthStatus()
      .then(res => setAuthenticated(res.data.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = () => {
    setAuthenticated(false);
  };

  const LoadingScreen = () => (
    <div className="h-screen w-full flex items-center justify-center bg-zen-flow">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin shadow-xl shadow-primary-100" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Establishing ZenTrack Bridge...
        </span>
      </div>
    </div>
  );

  return (
    <RefreshProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'bg-white text-slate-900 border border-slate-200 shadow-premium rounded-2xl text-xs font-bold px-6 py-4',
          }}
        />
        
        <Routes>
          {/* Public Landing Always Accessible Immediately */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth-Dependent Routes */}
          <Route path="*" element={
            checking ? (
              <LoadingScreen />
            ) : !authenticated ? (
              <Routes>
                <Route path="/login" element={<LoginPage onLogin={() => setAuthenticated(true)} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            ) : (
              <Routes>
                <Route element={<MainLayout onLogout={handleLogout} />}>
                  <Route path="/dashboard" element={<DashboardHome />} />
                  <Route path="/reconciliation" element={<ReconciliationView />} />
                  <Route path="/parties" element={<PartyManagement />} />
                  <Route path="/sender" element={<EmailSender />} />
                  <Route path="/logs" element={<LogsReporting />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            )
          } />
        </Routes>
      </BrowserRouter>
    </RefreshProvider>
  );
}
