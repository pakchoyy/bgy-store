'use client';
import { useRef, useState } from 'react';
import Modal from './Modal';
import DownloadModal from './DownloadModal';
import StickyBuyBar from './StickyBuyBar';

const paymentMethods = [
  { id: 'qris', label: 'QRIS', mark: 'QRIS', group: 'Instant Payment' },
  { id: 'ovo', label: 'OVO', mark: 'OVO', group: 'Instant Payment' },
  { id: 'dana', label: 'DANA', mark: 'DANA', group: 'Instant Payment' },
  { id: 'gopay', label: 'GoPay', mark: 'gopay', group: 'Instant Payment' },
  { id: 'bca', label: 'BCA Virtual Account', mark: 'BCA', group: 'Virtual Account' },
  { id: 'mandiri', label: 'Mandiri Virtual Account', mark: 'mandiri', group: 'Virtual Account' },
  { id: 'bni', label: 'BNI Virtual Account', mark: 'BNI', group: 'Virtual Account' },
  { id: 'cimb', label: 'CIMB Niaga', mark: 'CIMB', group: 'Virtual Account' },
  { id: 'alfamart', label: 'Alfamart', mark: 'Alfamart', group: 'Others' },
  { id: 'atm', label: 'ATM Bersama', mark: 'ATM', group: 'Others' },
];

export default function ProductActions({ product, settings }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('qris');
  const [showMethods, setShowMethods] = useState(false);
  const submitting = useRef(false);
  const soldOut = product.stock_type === 'limited' && product.stock_qty <= 0;
  const isFree = product.type === 'free';
  const price = Number(product.sale_price || 0);
  const selectedMethod = paymentMethods.find((item) => item.id === method) || paymentMethods[0];
  const fmt = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
  const openOrder = () => {
    if (!soldOut) setOpen(true);
  };
  async function checkout(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, product_id: product.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Pembayaran belum dapat diproses. Silakan coba lagi.');
      if (!data.payment_url || new URL(data.payment_url).protocol !== 'https:') throw new Error('Tautan pembayaran tidak tersedia.');
      window.location.assign(data.payment_url);
    } catch (err) { setError(err.message); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <>
    <button type="button" id="main-buy-button" disabled={soldOut} onClick={openOrder} className="relative z-10 w-full min-h-14 px-8 py-3 rounded-2xl font-extrabold text-white bg-gradient-to-r from-brand to-brand-dark shadow-lg shadow-teal-900/10 transition-transform duration-150 active:scale-[0.96] disabled:bg-none disabled:bg-gray-400 disabled:shadow-none">{soldOut ? 'Stok Habis' : isFree ? 'Download Gratis' : 'Beli Sekarang'}</button>
    <StickyBuyBar product={product} onBuy={openOrder} />
    {open && (isFree ? <DownloadModal product={product} settings={settings} isOpen onClose={() => setOpen(false)} /> :
      <Modal closeDisabled={busy} title="Checkout" onClose={() => { if (!busy) setOpen(false); }}>
        <form onSubmit={checkout} aria-busy={busy}>
          <fieldset disabled={busy} className="space-y-4">
            <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">You will make a payment to</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                  BGY
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-900">{settings?.site_name || 'Bantu Guru Yuk'}</p>
                  <p className="text-sm text-emerald-700">bgy-store.vercel.app</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">Buyer Info</p>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  <span className="text-red-500">*</span> Email
                  <input name="buyer_email" type="email" autoComplete="email" required maxLength={254} placeholder="Your Email" className="mt-1 block w-full rounded-xl border border-emerald-400 p-3 text-base outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  <span className="text-red-500">*</span> Name
                  <input name="buyer_name" autoComplete="name" required maxLength={120} placeholder="Your Name" className="mt-1 block w-full rounded-xl border border-slate-200 p-3 text-base outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  <span className="text-red-500">*</span> Phone Number
                  <input name="buyer_whatsapp" type="tel" autoComplete="tel" required pattern="[+0-9 ()-]{8,25}" placeholder="08xxxxxx" className="mt-1 block w-full rounded-xl border border-slate-200 p-3 text-base outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100" />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">Payment Detail</p>
              <div className="space-y-2 text-base">
                <div className="flex justify-between gap-4"><span>Subtotal</span><span>{fmt(price)}</span></div>
                <div className="flex justify-between gap-4 text-emerald-600"><span>Discount</span><span>- Rp 0</span></div>
                <div className="flex justify-between gap-4"><span>Convenience fee</span><span>Rp 0</span></div>
                <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 font-extrabold"><span>TOTAL</span><span>{fmt(price)}</span></div>
              </div>
              <button type="button" className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500 px-4 py-3 text-base font-extrabold text-emerald-600">
                <span aria-hidden="true">%</span> Add Voucher
              </button>
              <input type="hidden" name="payment_method" value={method} />
              <div className="mt-4 rounded-xl border border-emerald-500 p-3">
                <button type="button" onClick={() => setShowMethods((value) => !value)} className="flex w-full items-center gap-3 text-left">
                  <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-black text-slate-800">{selectedMethod.mark}</span>
                  <span className="flex-1 text-base font-extrabold text-emerald-600">{selectedMethod.label}</span>
                  <span aria-hidden="true" className="text-2xl text-emerald-500">›</span>
                </button>
                {showMethods && (
                  <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                    {['Instant Payment', 'Virtual Account', 'Others'].map((group) => (
                      <div key={group}>
                        <p className="mb-2 text-sm font-extrabold text-slate-400">{group}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {paymentMethods.filter((item) => item.group === group).map((item) => (
                            <button key={item.id} type="button" onClick={() => { setMethod(item.id); setShowMethods(false); }} className={`min-h-12 rounded-lg border px-3 text-center text-sm font-black ${method === item.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                              {item.mark}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-2xl" aria-hidden="true">🔒</div>
                  <div>
                    <p className="font-extrabold text-slate-700">Secure Payment</p>
                    <p className="text-sm text-slate-600">All payments will be processed securely by the payment gateway.</p>
                  </div>
                </div>
              </div>
            </section>

            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input required type="checkbox" className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600" />
              <span>I agree to the <span className="font-bold text-emerald-600">Terms of Use</span></span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600" />
              <span>I agree that the creator may contact me about this purchase and related updates.</span>
            </label>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
            <button disabled={busy} className="w-full min-h-14 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 px-4 py-3 text-white font-extrabold transition-transform duration-150 active:scale-[0.96] disabled:opacity-60">{busy ? 'Preparing payment...' : `Buy Now - IDR ${price.toLocaleString('id-ID')}`}</button>
          </fieldset>
          <p role="status" className="mt-3 min-h-5 text-sm text-slate-600">{busy ? 'Sedang menyiapkan pembayaran. Mohon tunggu...' : ''}</p>
        </form>
      </Modal>)}
  </>;
}
