import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const toastStyles = {
  success: {
    bg: '#ecfdf5',
    border: '#10b981',
    icon: '#10b981',
    text: '#047857'
  },
  error: {
    bg: '#fef2f2',
    border: '#ef4444',
    icon: '#ef4444',
    text: '#b91c1c'
  },
  warning: {
    bg: '#fffbeb',
    border: '#f59e0b',
    icon: '#f59e0b',
    text: '#b45309'
  },
  info: {
    bg: '#eff6ff',
    border: '#3b82f6',
    icon: '#3b82f6',
    text: '#1d4ed8'
  }
};

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
};

let toastTimeouts = {};

export function showToast({ type = 'info', title, message, duration = 4000 }) {
  const event = new CustomEvent('show-custom-toast', {
    detail: { type, title, message, duration }
  });
  window.dispatchEvent(event);
}

export function CustomToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...toast, id }]);
    
    if (toast.duration > 0) {
      toastTimeouts[id] = setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    if (toastTimeouts[id]) {
      clearTimeout(toastTimeouts[id]);
      delete toastTimeouts[id];
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handleShowToast = (e) => {
      addToast(e.detail);
    };
    window.addEventListener('show-custom-toast', handleShowToast);
    return () => window.removeEventListener('show-custom-toast', handleShowToast);
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;
        const style = toastStyles[toast.type] || toastStyles.info;
        
        return (
          <div
            key={toast.id}
            className="rounded-xl shadow-lg border overflow-hidden animate-in slide-in-from-right"
            style={{
              backgroundColor: style.bg,
              borderLeft: `4px solid ${style.border}`,
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div className="p-4 flex items-start gap-3">
              <Icon size={20} style={{ color: style.icon, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <p className="text-sm font-bold" style={{ color: style.text }}>
                    {toast.title}
                  </p>
                )}
                {toast.message && (
                  <p className="text-xs mt-1" style={{ color: style.text, opacity: 0.8 }}>
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}