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
  const bgColor = {
    default: 'bg-slate-900 text-white',
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
  }[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg px-4 py-3 shadow-lg flex items-center justify-between gap-4',
        bgColor
      )}
    >
      <p className="text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={() => onClose(id)}
        aria-label="Tutup notifikasi"
        className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded hover:opacity-75"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
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
