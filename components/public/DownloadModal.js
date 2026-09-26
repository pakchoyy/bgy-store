'use client';

import { useState, useEffect, useCallback } from 'react';
import { CloseButton } from '@/components/ui/close-button';

const TIP_PRESETS = [5000, 10000, 20000];

export default function DownloadModal({ product, isOpen, onClose, settings }) {
  const [phase, setPhase] = useState(1);
  const [countdown, setCountdown] = useState(5);
  const [downloading, setDownloading] = useState(false);
  const [showTraktirForm, setShowTraktirForm] = useState(false);
  const [tipAmount, setTipAmount] = useState(10000);
  const [tipBusy, setTipBusy] = useState(false);
  const [tipError, setTipError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhase(1);
      setCountdown(5);
      setDownloading(false);
      setShowTraktirForm(false);
      setTipAmount(10000);
      setTipBusy(false);
      setTipError('');
      setDownloadError('');
      setDownloaded(false);
    }
  }, [isOpen]);

  const triggerDownload = useCallback(async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      const response = await fetch('/api/download/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || 'File belum dapat diunduh.');
      window.location.assign(data.url);
      setDownloaded(true);
      setDownloading(false);
    } catch (e) {
      setDownloading(false);
      setDownloadError(e.message || 'File belum dapat diunduh. Coba lagi.');
    }
  }, [product]);

  useEffect(() => {
    if (phase !== 2 || downloading || downloadError || downloaded) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    triggerDownload();
  }, [phase, countdown, downloading, downloadError, downloaded, triggerDownload]);

  const handleSkipTraktir = useCallback(() => {
    setPhase(2);
  }, []);

  const submitTraktir = useCallback(async (event) => {
    event.preventDefault();
    setTipBusy(true);
    setTipError('');
    try {
      const response = await fetch('/api/traktir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: tipAmount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyiapkan pembayaran. Coba lagi ya.');
      if (!data.payment_url || new URL(data.payment_url).protocol !== 'https:') throw new Error('Tautan pembayaran tidak tersedia.');
      window.open(data.payment_url, '_blank', 'noopener,noreferrer');
      setPhase(2);
    } catch (submitError) {
      setTipError(submitError.message);
    } finally {
      setTipBusy(false);
    }
  }, [tipAmount]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget && (phase === 1 || downloaded)) {
      onClose();
    }
  }, [phase, downloaded, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300 ${
          phase === 1 ? 'animate-fadeIn scale-100' : 'animate-slideUp'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {phase === 1 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 id="download-modal-title" className="text-lg font-bold text-gray-900">Download {product.title}</h3>
              <CloseButton onClick={onClose} />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                {product.category && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                    style={{ backgroundColor: `${product.category.color}20`, color: product.category.color }}
                  >
                    {product.category.name}
                  </span>
                )}
                {product.file_size && (
                  <span className="text-xs text-gray-400">{product.file_size}</span>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">{(product.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}</p>
            </div>

            {!showTraktirForm && (
              <>
                <p className="text-sm text-gray-700 font-medium mb-4 text-center">
                  Dukung Pak Choy dengan traktir kopi agar semangat berkarya 😊
                </p>

                <button
                  onClick={() => setShowTraktirForm(true)}
                  className="w-full bg-gradient-to-r from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] text-white font-bold px-6 py-3 rounded-xl hover:shadow-md active:scale-[0.98] transition-all duration-200 mb-3"
                >
                  ☕ Traktir Kopi
                </button>

                <button
                  onClick={handleSkipTraktir}
                  className="w-full rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 font-semibold py-2.5 transition-colors"
                >
                  Kapan-kapan ya Pak, langsung download 😅
                </button>
              </>
            )}

            {showTraktirForm && (
              <form onSubmit={submitTraktir} aria-busy={tipBusy} className="space-y-3">
                {tipError && (
                  <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                    {tipError}
                  </p>
                )}

                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Nominal traktir</p>
                  <div className="flex gap-1.5">
                    {TIP_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTipAmount(preset)}
                        className={`flex-1 rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
                          tipAmount === preset ? 'border-[#0ea5a0] bg-[#0ea5a0]/10 text-[#0d7a8a]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {`Rp${preset.toLocaleString('id-ID')}`}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    aria-label="Nominal traktir lainnya"
                    min={1000}
                    step={1000}
                    value={tipAmount}
                    onChange={(e) => setTipAmount(Math.max(0, Number(e.target.value)))}
                    className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0ea5a0] focus:ring-2 focus:ring-[#0ea5a0]/20"
                    placeholder="Nominal lainnya"
                  />
                </div>

                <button
                  type="submit"
                  disabled={tipBusy || tipAmount < 1000}
                  className="w-full bg-gradient-to-r from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] text-white font-bold px-6 py-3 rounded-xl hover:shadow-md active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
                >
                  {tipBusy ? 'Menyiapkan pembayaran...' : `Bayar Rp${tipAmount.toLocaleString('id-ID')}`}
                </button>

                <button
                  type="button"
                  onClick={handleSkipTraktir}
                  disabled={tipBusy}
                  className="w-full rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 font-semibold py-2.5 transition-colors disabled:opacity-60"
                >
                  Kapan-kapan ya Pak, langsung download 😅
                </button>
              </form>
            )}
          </div>
        )}

        {phase === 2 && (
          <div className="relative p-6 text-center">
            {(downloaded || downloadError) && (
              <CloseButton onClick={onClose} className="absolute right-4 top-4" />
            )}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${downloaded ? 'bg-emerald-500' : 'bg-[#0ea5a0] animate-bounce'}`}>
              {downloaded ? (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
            </div>

            <h3 role="status" className="text-lg font-bold text-gray-900 mb-2">
              {downloaded ? 'Download berhasil! 🎉' : downloading ? 'Mengunduh...' : 'Download Siap'}
            </h3>

            {downloaded ? (
              <p className="mb-4 text-sm text-gray-600">
                File sedang diunduh. Cek notifikasi browser atau folder <strong>Download</strong> di HP kamu.
              </p>
            ) : (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-amber-700">
                  {settings?.promo_download_text || '💡 Unduh dalam hitungan detik! File akan otomatis terdownload.'}
                </p>
              </div>
            )}

            {countdown > 0 && !downloading && !downloaded && !downloadError && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-gradient-to-r from-[#0ea5a0] to-[#2d6a7f] h-2.5 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">Download otomatis dalam {countdown} detik...</p>
              </div>
            )}

            {downloadError && (
              <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {downloadError}
              </p>
            )}

            {downloaded ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] px-6 py-3 text-sm font-bold text-white"
                >
                  Selesai
                </button>
                <button
                  type="button"
                  onClick={triggerDownload}
                  className="text-xs font-semibold text-gray-500 underline hover:text-gray-700"
                >
                  File belum masuk? Download ulang
                </button>
              </div>
            ) : !downloading && (downloadError || countdown === 0) ? (
              <button
                type="button"
                onClick={triggerDownload}
                className="mt-1 w-full rounded-xl bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] px-6 py-3 text-sm font-bold text-white"
              >
                Coba lagi
              </button>
            ) : null}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}
