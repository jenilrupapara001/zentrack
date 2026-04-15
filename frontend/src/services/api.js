import axios from 'axios';

/**
 * PRODUCTION PROXY ARCHITECTURE
 * ----------------------------
 * ZenTrack uses a Vercel-to-Render proxy bridge.
 * This ensures that API requests are treated as "Same-Origin," 
 * guaranteeing 100% session cookie reliability in all browsers.
 */
const api = axios.create({
  baseURL: '/api', // Proxied via vercel.json
  withCredentials: true,
});

// Production Diagnostic Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.PROD) {
      console.error('📡 ZenTrack Network Error:', {
        status: error.response?.status,
        path: error.config?.url,
        message: error.message,
        hint: error.response?.status === 504 ? 'Render Gateway Timeout (Backend Cold Start)' : 'Connection Refused'
      });
    }
    return Promise.reject(error);
  }
);

// Diagnostic telemetry
if (import.meta.env.DEV) {
  console.log('🚀 ZenTrack API initialized (Bridge Mode)');
}

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
export const retryEmails = (logIds) => api.post('/email/retry', { logIds });
export const getEmailLogs = () => api.get('/email/logs');
export const getDailyEmailLogs = () => api.get('/email/logs/daily');
export const getEmailLogsByDate = (date) => api.get(`/email/logs/by-date/${date}`);
export const downloadEmailLogTxt = () =>
  api.get('/email/log/download', { responseType: 'blob' });
export const downloadEmailLogExcel = () =>
  api.get('/email/log/excel', { responseType: 'blob' });

// ── Settings ─────────────────────────────────────────────────────────────────
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
