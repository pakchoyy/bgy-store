'use client';
import { useRef, useState } from 'react';
import Modal from './Modal';
import DownloadModal from './DownloadModal';
import StickyBuyBar from './StickyBuyBar';
import { addCartItem } from '@/lib/cart';

const paymentGroups = [
  { title: 'Instant Payment', items: ['QRIS', 'ShopeePay', 'OVO', 'DANA', 'GoPay', 'LinkAja'] },
  { title: 'Virtual Account', items: ['BCA', 'Mandiri', 'BRIVA', 'BNI', 'Permata', 'CIMB'] },
  { title: 'Retail & Card', items: ['Alfamart', 'Indomaret', 'Kartu'] },
];

export default function ProductActions({ product, settings }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const submitting = useRef(false);
  const soldOut = product.stock_type === 'limited' && product.stock_qty <= 0;
  const isFree = product.type === 'free';
  const price = Number(product.sale_price || 0);
  const fmt = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
  const openOrder = () => {
    if (!soldOut) setOpen(true);
  };
  const addToCart = () => {
    if (soldOut || isFree) return;
    addCartItem(product);
    setCartMessage('Produk masuk keranjang.');
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
    <div className={!isFree && !soldOut ? 'grid gap-3 sm:grid-cols-[1fr_auto]' : ''}>
      <button type="button" id="main-buy-button" disabled={soldOut} onClick={openOrder} className="store-buy-button relative z-10 w-full min-h-14 px-8 py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-brand to-brand-dark shadow-lg shadow-teal-900/10 transition-transform duration-150 active:scale-[0.96] disabled:bg-none disabled:bg-gray-400 disabled:shadow-none">{soldOut ? 'Stok Habis' : isFree ? 'Download Gratis' : product.purchase_button_label || 'Beli Sekarang'}</button>
      {!isFree && !soldOut && (
        <button type="button" onClick={addToCart} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-brand-dark/20 bg-white px-5 py-3 text-sm font-semibold text-brand-dark shadow-sm transition-[background-color,transform] duration-150 hover:bg-teal-50 active:scale-[0.96]" aria-label={`Tambah ${product.title} ke keranjang`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20 8H7M12 10v4M10 12h4M10 21h.01M17 21h.01" />
          </svg>
          Keranjang
        </button>
      )}
    </div>
    {!soldOut && <p role="status" className="mt-2 text-center text-xs text-slate-500">{cartMessage || (isFree ? 'File disiapkan langsung dari halaman ini.' : 'Bisa beli langsung atau simpan dulu ke keranjang.')}</p>}
    <StickyBuyBar product={product} onBuy={openOrder} onAddToCart={addToCart} />
    {open && (isFree ? <DownloadModal product={product} settings={settings} isOpen onClose={() => setOpen(false)} /> :
      <Modal closeDisabled={busy} title="Checkout" size="checkout" onClose={() => { if (!busy) setOpen(false); }}>
        <form onSubmit={checkout} aria-busy={busy}>
          <fieldset disabled={busy} className="grid gap-5 lg:grid-cols-[1.02fr_.98fr]">
            <div className="space-y-4">
              <section className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm ring-1 ring-emerald-100">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Product</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700 ring-1 ring-black/5">
                    {product.cover_path ? <img src={product.cover_path} alt="" className="h-full w-full object-cover" /> : 'BGY'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-base font-semibold text-slate-900">{product.title}</p>
                    <p className="mt-1 text-sm text-slate-500">1x produk digital</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-900">{fmt(price)}</p>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Buyer Info</p>
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
                    <input name="buyer_whatsapp" type="tel" autoComplete="tel" required pattern="[+0-9 ()\\-]{8,25}" placeholder="08xxxxxx" className="mt-1 block w-full rounded-xl border border-slate-200 p-3 text-base outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100" />
                  </label>
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Payment Detail</p>
                <div className="space-y-2 text-base">
                  <div className="flex justify-between gap-4"><span>Subtotal</span><span>{fmt(price)}</span></div>
                  <div className="flex justify-between gap-4 text-emerald-600"><span>Discount</span><span>- Rp 0</span></div>
                  <div className="flex justify-between gap-4"><span>Convenience fee</span><span>Rp 0</span></div>
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{fmt(price)}</span></div>
                </div>
                <button type="button" className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500 px-4 py-3 text-base font-semibold text-emerald-600 transition-transform duration-150 active:scale-[0.96]">
                  <span aria-hidden="true">%</span> Add Voucher
                </button>
              </section>

              <section className="rounded-2xl border border-emerald-500 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-sm">
                <input type="hidden" name="payment_method" value="mayar" />
                <button type="button" className="flex min-h-14 w-full items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-emerald-100">
                  <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-lg font-black text-emerald-700">M</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-emerald-700">Pilih metode di Mayar</span>
                    <span className="block text-xs font-medium text-slate-500">QRIS, VA, e-wallet, retail, dan kartu.</span>
                  </span>
                  <span className="text-xl text-emerald-500" aria-hidden="true">›</span>
                </button>
                <div className="mt-3 space-y-3">
                  {paymentGroups.map((group) => (
                    <div key={group.title} className="rounded-xl bg-white/80 p-3 ring-1 ring-emerald-100">
                      <p className="text-xs font-semibold text-slate-500">{group.title}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <span key={item} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-emerald-100/80 p-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-black text-emerald-600 ring-1 ring-emerald-200" aria-hidden="true">✓</div>
                  <div>
                    <p className="font-semibold text-slate-700">Secure Payment</p>
                    <p className="text-sm text-slate-600">Pembayaran diproses aman lewat gateway Mayar.</p>
                  </div>
                </div>
              </section>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input required type="checkbox" className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600" />
                  <span>I agree to the <span className="font-bold text-emerald-600">Terms of Use</span></span>
                </label>
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input type="checkbox" className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600" />
                  <span>I agree that the creator may contact me about this purchase and related updates.</span>
                </label>
              </div>

              {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
              <button disabled={busy} className="w-full min-h-14 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 px-4 py-3 text-white font-semibold shadow-lg shadow-emerald-900/10 transition-transform duration-150 active:scale-[0.96] disabled:opacity-60">{busy ? 'Preparing payment...' : `Buy Now - IDR ${price.toLocaleString('id-ID')}`}</button>
            </div>
          </fieldset>
          <p role="status" className="mt-3 min-h-5 text-sm text-slate-600">{busy ? 'Sedang menyiapkan pembayaran. Mohon tunggu...' : ''}</p>
        </form>
      </Modal>)}
  </>;
}
