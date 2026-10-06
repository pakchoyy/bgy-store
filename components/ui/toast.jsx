'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'default', duration = 3000) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), type === 'error' ? Math.max(duration, 5000) : duration);
    }

    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function Toast({ id, message, type = 'default', onClose }) {
  const styles = {
    default: { badge: 'bg-slate-100 text-slate-700', icon: 'ℹ' },
    success: { badge: 'bg-emerald-100 text-emerald-700', icon: '✓' },
    error: { badge: 'bg-red-100 text-red-600', icon: '!' },
    warning: { badge: 'bg-amber-100 text-amber-700', icon: '!' },
  }[type] || { badge: 'bg-slate-100 text-slate-700', icon: 'ℹ' };

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className="animate-toast-in flex w-full max-w-xs items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 py-2.5 pl-3 pr-2 shadow-xl shadow-slate-900/10 backdrop-blur"
    >
      <span aria-hidden="true" className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black', styles.badge)}>
        {styles.icon}
      </span>
      <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-slate-800">{message}</p>
      <button
        type="button"
        onClick={() => onClose(id)}
        aria-label="Tutup notifikasi"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export function Toaster() {
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col items-end gap-2 sm:left-auto lg:bottom-4 [&>*]:pointer-events-auto">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}
