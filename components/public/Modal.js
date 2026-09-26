'use client';
import { useEffect, useRef } from 'react';
import { CloseButton } from '@/components/ui/close-button';
export default function Modal({ title, onClose, closeDisabled = false, size = 'md', children }) {
  const ref = useRef(null);
  const sizeClass = size === 'checkout' ? 'max-w-4xl' : 'max-w-md';
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
    className={`w-[calc(100%-2rem)] ${sizeClass} max-h-[90dvh] rounded-3xl p-0 shadow-2xl shadow-slate-950/20 backdrop:bg-slate-950/55`}>
    <div className={`max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-6 ${size === 'checkout' ? 'pb-6' : ''}`}><div className="mb-5 flex items-start justify-between gap-4">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <CloseButton disabled={closeDisabled} label="Tutup dialog" onClick={onClose} />
    </div>{children}</div>
  </dialog>;
}
