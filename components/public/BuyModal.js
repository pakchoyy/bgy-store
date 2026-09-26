'use client';

import { useEffect, useState } from 'react';
import { readRememberedVoucher } from '@/lib/voucher-memory';
import { CloseButton } from '@/components/ui/close-button';
import WhatsAppBuyButton from '@/components/public/WhatsAppBuyButton';

const paymentLogos = [
  { name: 'QRIS', src: '/logos/qris.svg' },
  { name: 'GoPay', src: '/logos/gopay.svg' },
  { name: 'DANA', src: '/logos/dana.svg' },
  { name: 'OVO', src: '/logos/ovo.svg' },
  { name: 'ShopeePay', src: '/logos/shopeepay.svg' },
  { name: 'BCA', src: '/logos/bca.svg' },
  { name: 'Mandiri', src: '/logos/mandiri.svg' },
  { name: 'BNI', src: '/logos/bni.svg' },
];

const MIN_PAYMENT = 1000;

function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

export default function BuyModal({ product, isOpen, onClose, waUrl }) {
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherState, setVoucherState] = useState({ status: 'idle', message: '', discount: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const price = Number(product?.sale_price || 0);
  const total = Math.max(0, price - voucherState.discount);
  const tooSmall = total > 0 && total < MIN_PAYMENT;

  useEffect(() => {
    const remembered = readRememberedVoucher();
    if (!remembered) return;
    setVoucherCode(remembered);
    setVoucherOpen(true);
    applyVoucher(remembered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyVoucher(codeOverride) {
    const code = String(typeof codeOverride === 'string' ? codeOverride : voucherCode).trim().toUpperCase();
    if (!code) {
      setVoucherState({ status: 'error', message: 'Masukkan kode voucher terlebih dahulu.', discount: 0 });
      return;
    }
    setVoucherState({ status: 'loading', message: '', discount: 0 });
    try {
      const response = await fetch(`/api/voucher/validate?code=${encodeURIComponent(code)}&amount=${price}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Voucher tidak dapat digunakan.');
      setVoucherState({ status: 'success', message: data.message, discount: Number(data.discount || 0) });
    } catch (applyError) {
      setVoucherState({ status: 'error', message: applyError.message, discount: 0 });
    }
  }

  async function submitCheckout(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, product_id: product.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Pembayaran belum dapat diproses. Silakan coba lagi.');
      if (typeof data.redirect_url === 'string' && data.redirect_url.startsWith('/') && !data.redirect_url.startsWith('//')) {
        window.location.assign(data.redirect_url);
        return;
      }
      if (!data.payment_url || new URL(data.payment_url).protocol !== 'https:') throw new Error('Tautan pembayaran tidak tersedia.');
      window.location.assign(data.payment_url);
    } catch (submitError) {
      setError(submitError.message);
      setBusy(false);
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !busy) onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="animate-slideUp flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#eef7f5] shadow-2xl sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <p className="text-sm font-bold text-slate-900">Checkout</p>
          <CloseButton onClick={onClose} disabled={busy} />
        </div>

        <div className="overflow-y-auto">
          <form onSubmit={submitCheckout} aria-busy={busy} className="space-y-3 p-3">
            <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-emerald-50 ring-1 ring-slate-200">
                  {product.cover_path ? (
                    <img src={product.cover_path} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-black text-emerald-700">BGY</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold leading-snug">{product.title}</p>
                  <p className="text-xs text-slate-500">1x produk digital</p>
                </div>
                <p className="shrink-0 text-sm font-bold">{formatRupiah(price)}</p>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80">
              <div className="grid gap-2.5">
                <label className="text-sm font-semibold text-slate-700">
                  <span className="text-red-500">*</span> Email
                  <input name="buyer_email" type="email" autoComplete="email" required maxLength={254} placeholder="nama@email.com" className="mt-1 block h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  <span className="text-red-500">*</span> Nama
                  <input name="buyer_name" autoComplete="name" required maxLength={120} placeholder="Nama lengkap" className="mt-1 block h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  <span className="text-red-500">*</span> WhatsApp
                  <input name="buyer_whatsapp" type="tel" autoComplete="tel" required pattern="[0-9+ \(\)\-]{8,25}" inputMode="tel" placeholder="08xxxxxxxxxx" className="mt-1 block h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-4"><span className="text-slate-500">Subtotal</span><span>{formatRupiah(price)}</span></div>
                <div className="flex justify-between gap-4 text-emerald-700"><span>Diskon</span><span>- {formatRupiah(voucherState.discount)}</span></div>
                <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 text-base font-bold"><span>Total</span><span>{formatRupiah(total)}</span></div>
              </div>
              <input type="hidden" name="voucher_code" value={voucherCode} />
              <button type="button" onClick={() => setVoucherOpen((v) => !v)} aria-expanded={voucherOpen} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500 px-4 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                <span aria-hidden="true">%</span>{voucherState.status === 'success' ? 'Ubah voucher' : 'Tambah voucher'}
              </button>
              {voucherOpen && (
                <div className="mt-2 rounded-xl bg-emerald-50 p-2.5">
                  <div className="flex gap-2">
                    <input id="voucher-code" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} autoComplete="off" placeholder="Kode voucher" className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    <button type="button" onClick={() => applyVoucher()} disabled={voucherState.status === 'loading'} className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white disabled:opacity-60">{voucherState.status === 'loading' ? 'Cek...' : 'Pakai'}</button>
                  </div>
                  {voucherState.message && (
                    <p role={voucherState.status === 'error' ? 'alert' : 'status'} className={`mt-1.5 text-xs font-semibold ${voucherState.status === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{voucherState.message}</p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-xs font-semibold text-slate-500">Metode pembayaran tersedia di halaman berikutnya</p>
              <div className="mt-2 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {paymentLogos.map((logo) => (
                  <div key={logo.name} title={logo.name} className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1">
                    <img src={logo.src} alt={logo.name} loading="lazy" className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            </section>

            <label className="flex items-start gap-2 text-xs text-slate-700">
              <input required type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-600" />
              <span>Saya menyetujui <a href="/halaman/syarat-dan-ketentuan" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-700 underline underline-offset-2">Syarat dan Ketentuan</a>.</span>
            </label>

            {tooSmall && (
              <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                Total pembayaran online minimal {formatRupiah(MIN_PAYMENT)}. {voucherState.discount > 0 ? 'Hapus atau ganti voucher.' : 'Hubungi admin untuk produk ini.'}
              </p>
            )}
            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <button disabled={busy || tooSmall} className="h-12 w-full rounded-xl bg-emerald-700 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'Memproses...' : total === 0 ? 'Ambil Gratis dengan Voucher' : `Beli sekarang - ${formatRupiah(total)}`}
            </button>
            <WhatsAppBuyButton waUrl={waUrl} product={product} className="pt-1 pb-[env(safe-area-inset-bottom)]" />
          </form>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.25s ease-out; }
      `}</style>
    </div>
  );
}
