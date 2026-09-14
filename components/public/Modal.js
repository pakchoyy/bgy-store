'use client';
import { useEffect, useRef } from 'react';
export default function Modal({ title, onClose, closeDisabled = false, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-label={title} onCancel={(e) => { e.preventDefault(); if (!closeDisabled) onClose(); }}
    onClick={(e) => { if (!closeDisabled && e.target === e.currentTarget) onClose(); }}
    className="w-[calc(100%-2rem)] max-w-md max-h-[90dvh] rounded-2xl p-0 shadow-2xl backdrop:bg-black/50">
    <div className="p-6"><div className="flex items-start justify-between gap-4 mb-5">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <button type="button" disabled={closeDisabled} aria-label="Tutup dialog" onClick={onClose} className="shrink-0 min-w-11 min-h-11 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40">✕</button>
    </div>{children}</div>
  </dialog>;
}
