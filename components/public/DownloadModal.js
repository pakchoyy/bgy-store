'use client';

import { useState, useEffect, useCallback } from 'react';

const TIP_PRESETS = [5000, 10000, 20000];

export default function DownloadModal({ product, isOpen, onClose, settings }) {
  const [phase, setPhase] = useState(1);
  const [countdown, setCountdown] = useState(5);
  const [downloading, setDownloading] = useState(false);
  const [showTraktirForm, setShowTraktirForm] = useState(false);
  const [tipAmount, setTipAmount] = useState(10000);
  const [tipBusy, setTipBusy] = useState(false);
  const [tipError, setTipError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPhase(1);
      setCountdown(5);
      setDownloading(false);
      setShowTraktirForm(false);
      setTipAmount(10000);
      setTipBusy(false);
      setTipError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (phase === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 2 && countdown === 0 && !downloading) {
      triggerDownload();
    }
  }, [phase, countdown]);

  const triggerDownload = useCallback(() => {
    setDownloading(true);
    try {
      if (product.file_url) {
        const a = document.createElement('a');
        a.href = product.file_url;
        a.download = product.file_name || product.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Download failed:', e);
    }
  }, [product]);

  const handleSkipTraktir = useCallback(() => {
    setPhase(2);
  }, []);

  const submitTraktir = useCallback(async (event) => {
    event.preventDefault();
    setTipBusy(true);
    setTipError('');
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch('/api/traktir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, amount: tipAmount }),
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
    if (e.target === e.currentTarget && phase === 1) {
      onClose();
    }
  }, [phase, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
              <h3 className="text-lg font-bold text-gray-900">Download {product.title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
              <p className="text-sm text-gray-600">{product.description}</p>
            </div>

            {!showTraktirForm && (
              <>
                <p className="text-sm text-gray-700 font-medium mb-4 text-center">
                  Dukung kami dengan traktir kopi agar terus berkarya!
                </p>

                <button
                  onClick={() => setShowTraktirForm(true)}
                  className="w-full bg-gradient-to-r from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] text-white font-bold px-6 py-3 rounded-xl hover:shadow-md active:scale-[0.98] transition-all duration-200 mb-3"
                >
                  ☕ Traktir Kopi
                </button>

                <button
                  onClick={handleSkipTraktir}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
                >
                  Tidak dulu, langsung download
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
                    min={1000}
                    step={1000}
                    value={tipAmount}
                    onChange={(e) => setTipAmount(Math.max(0, Number(e.target.value)))}
                    className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0ea5a0] focus:ring-2 focus:ring-[#0ea5a0]/20"
                    placeholder="Nominal lainnya"
                  />
                </div>

                <input name="buyer_email" type="email" required maxLength={254} placeholder="Email" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0ea5a0] focus:ring-2 focus:ring-[#0ea5a0]/20" />
                <input name="buyer_name" required maxLength={120} placeholder="Nama" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0ea5a0] focus:ring-2 focus:ring-[#0ea5a0]/20" />
                <input name="buyer_whatsapp" type="tel" required pattern="[+0-9 ()-]{8,25}" placeholder="No. WhatsApp" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0ea5a0] focus:ring-2 focus:ring-[#0ea5a0]/20" />

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
                  className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors disabled:opacity-60"
                >
                  Tidak dulu, langsung download
                </button>
              </form>
            )}
          </div>
        )}

        {phase === 2 && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-[#0ea5a0] rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {downloading ? 'Mengunduh...' : 'Download Siap'}
            </h3>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-amber-700">
                {settings?.promo_download_text || '💡 Unduh dalam hitungan detik! File akan otomatis terdownload.'}
              </p>
            </div>

            {countdown > 0 && !downloading && (
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

            {!downloading && countdown === 0 && (
              <p className="text-sm text-gray-500">Mengunduh file...</p>
            )}

            {!downloading && (
              <button
                onClick={triggerDownload}
                className="mt-3 text-sm text-[#0ea5a0] hover:text-[#0d7a8a] font-semibold underline transition-colors"
              >
                Klik jika download tidak dimulai
              </button>
            )}

            {downloading && (
              <button
                onClick={onClose}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Tutup
              </button>
            )}
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
