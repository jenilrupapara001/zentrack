import axios from 'axios';

/**
 * SMART DISCOVERY PROTOCOL
 * -------------------------
 * ZenTrack automatically detects its deployment coordinate to ensure 
 * high-fidelity connectivity even if environment variables are missing.
 */
const getBaseURL = () => {
  // 1. Priority: Environment Variable (Vercel/Render Build Time)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 2. Fallback: Operational Auto-Discovery (Domain Awareness)
  if (typeof window !== 'undefined' && window.location.hostname === 'zentrack-alpha.vercel.app') {
    return 'https://zentrack-pkos.onrender.com/api';
  }

  // 3. Default: Local Development Bridge
  return '/api';
};

const baseURL = getBaseURL();

// Diagnostic telemetry for production handshake
if (import.meta.env.DEV || (typeof window !== 'undefined' && window.location.search.includes('debug=true'))) {
  console.log('🚀 ZenTrack API Handshake:', baseURL);
}

const api = axios.create({
  baseURL: baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL,
  withCredentials: true,
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (credentials) => api.post('/auth/login', credentials);
export const logout = () => api.post('/auth/logout');
export const getAuthStatus = () => api.get('/auth/status');

// ── Party Emails ──────────────────────────────────────────────────────────────
export const getPartyEmails = () => api.get('/party-emails');
export const uploadPartyEmails = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/party-emails/upload', form);
};
export const updatePartyEmail = (id, data) =>
  api.put(`/party-emails/${id}`, data);
export const downloadSampleMailExcel = () =>
  api.get('/party-emails/sample', { responseType: 'blob' });

// ── Reconciliation ────────────────────────────────────────────────────────────
export const uploadReconciliationFiles = (file, syncToDatabase = false) => {
  const form = new FormData();
  form.append('file', file);
  form.append('syncToDatabase', syncToDatabase);
  return api.post('/reconciliation/upload', form);
};
export const getSession = () => api.get('/reconciliation/session');
export const getSessionById = (id) => api.get(`/reconciliation/session/${id}`);
export const downloadSamplePaymentExcel = () =>
  api.get('/reconciliation/sample', { responseType: 'blob' });
export const downloadPartywiseExcel = () =>
  api.get('/reconciliation/download/partywise', { responseType: 'blob' });

// ── Email ─────────────────────────────────────────────────────────────────────
export const sendEmails = (data) => api.post('/email/send', data);
export const getEmailLogs = () => api.get('/email/logs');
export const downloadEmailLogTxt = () =>
  api.get('/email/log/download', { responseType: 'blob' });
export const downloadEmailLogExcel = () =>
  api.get('/email/log/excel', { responseType: 'blob' });

// ── Settings ─────────────────────────────────────────────────────────────────
export const getSmtpCredentials = () => api.get('/settings/smtp');
export const addSmtpCredential = (data) => api.post('/settings/smtp', data);
export const deleteSmtpCredential = (id) => api.delete(`/settings/smtp/${id}`);
export const downloadNoEmailCsv = (partiesWithoutEmail) =>
  api.get('/email/log/no-email/download', {
    params: { partiesWithoutEmail: encodeURIComponent(JSON.stringify(partiesWithoutEmail)) },
    responseType: 'blob',
  });
export const downloadSkipCsv = (skipLog) =>
  api.get('/email/log/skip/download', {
    params: { skipLog: encodeURIComponent(JSON.stringify(skipLog)) },
    responseType: 'blob',
  });

// ── Stats ───────────────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get('/stats');

// ── Utility ───────────────────────────────────────────────────────────────────
export function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default api;
