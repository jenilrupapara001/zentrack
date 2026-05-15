import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { App as AntdApp, ConfigProvider, Spin } from 'antd';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await getAuthStatus();
        setAuthenticated(res.data.authenticated);
      } catch (err) {
        console.error('🛡️ Auth check failed:', err);
        setAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    setAuthenticated(false);
  };

  if (checking) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <Spin size="large" description="Initializing ZenTrack..." />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <AntdApp>
        <RefreshProvider>
          <BrowserRouter>
            <Routes>
              {/* Root Redirect */}
              <Route path="/" element={<Navigate to={authenticated ? "/dashboard" : "/login"} replace />} />

              {/* Public Routes */}
              <Route path="/login" element={
                authenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={() => setAuthenticated(true)} />
              } />

              {/* Protected Dashboard Routes */}
              <Route element={authenticated ? <MainLayout onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
                <Route path="/dashboard" element={<DashboardHome />} />
                <Route path="/reconciliation" element={<ReconciliationView />} />
                <Route path="/parties" element={<PartyManagement />} />
                <Route path="/sender" element={<EmailSender />} />
                <Route path="/logs" element={<LogsReporting />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to={authenticated ? "/dashboard" : "/login"} replace />} />
            </Routes>
          </BrowserRouter>
        </RefreshProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
