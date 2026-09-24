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
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherState, setVoucherState] = useState({ status: 'idle', message: '', discount: 0 });
  const [selectedMethod, setSelectedMethod] = useState('');
  const submitting = useRef(false);
  const soldOut = product.stock_type === 'limited' && product.stock_qty <= 0;
  const isFree = product.type === 'free';
  const price = Number(product.sale_price || 0);
  const fmt = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
  const total = Math.max(0, price - voucherState.discount);
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
  async function applyVoucher() {
    const code = voucherCode.trim().toUpperCase();
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
    } catch (err) {
      setVoucherState({ status: 'error', message: err.message, discount: 0 });
    }
  }
  return <>
    <div className={!isFree && !soldOut ? 'grid gap-3 sm:grid-cols-[1fr_auto]' : ''}>
      <button type="button" id="main-buy-button" disabled={soldOut} onClick={openOrder} className="store-buy-button relative z-10 w-full min-h-12 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand to-brand-dark shadow-lg shadow-teal-900/10 transition-transform duration-150 active:scale-[0.96] disabled:bg-none disabled:bg-gray-400 disabled:shadow-none">{soldOut ? 'Stok Habis' : isFree ? 'Download Gratis' : product.purchase_button_label || 'Beli Sekarang'}</button>
      {!isFree && !soldOut && (
          <button type="button" onClick={addToCart} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-brand-dark/20 bg-white px-5 py-3 text-sm font-semibold text-brand-dark shadow-sm transition-[background-color,transform] duration-150 hover:bg-teal-50 active:scale-[0.96]" aria-label={`Tambah ${product.title} ke keranjang`}>
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
                <input type="hidden" name="voucher_code" value={voucherCode} />
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
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between gap-4"><span>Subtotal</span><span>{fmt(price)}</span></div>
                  <div className="flex justify-between gap-4 text-emerald-600"><span>Discount</span><span>- {fmt(voucherState.discount)}</span></div>
                  <div className="flex justify-between gap-4"><span>Convenience fee</span><span>Rp 0</span></div>
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{fmt(total)}</span></div>
                </div>
                <button type="button" onClick={() => setVoucherOpen((value) => !value)} aria-expanded={voucherOpen} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-transform duration-150 active:scale-[0.96]">
                  <span aria-hidden="true">%</span> {voucherState.status === 'success' ? 'Ubah voucher' : 'Tambah voucher'}
                </button>
                {voucherOpen && (
                  <div className="mt-3 rounded-xl bg-emerald-50 p-3">
                    <label htmlFor="voucher-code" className="text-xs font-semibold text-slate-600">Kode voucher</label>
                    <div className="mt-2 flex gap-2">
                      <input id="voucher-code" value={voucherCode} onChange={(event) => setVoucherCode(event.target.value.toUpperCase())} autoComplete="off" placeholder="Contoh: BGYHEMAT" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-semibold uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                      <button type="button" onClick={applyVoucher} disabled={voucherState.status === 'loading'} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">{voucherState.status === 'loading' ? 'Cek...' : 'Pakai'}</button>
                    </div>
                    {voucherState.message && <p role={voucherState.status === 'error' ? 'alert' : 'status'} className={`mt-2 text-xs font-semibold ${voucherState.status === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{voucherState.message}</p>}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-emerald-500 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-sm">
                <input type="hidden" name="payment_method" value="mayar" />
                <label className="block text-sm font-semibold text-emerald-700" htmlFor="payment-method">Metode pembayaran
                  <select id="payment-method" value={selectedMethod} onChange={(event) => setSelectedMethod(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-base font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                    <option value="">Pilih metode pembayaran</option>
                    {paymentGroups.map((group) => <optgroup key={group.title} label={group.title}>{group.items.map((item) => <option key={item} value={item}>{item}</option>)}</optgroup>)}
                  </select>
                </label>
                <p className="mt-2 text-xs font-medium text-slate-500">Metode lengkap akan tersedia pada halaman pembayaran berikutnya.</p>
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-emerald-100/80 p-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-black text-emerald-600 ring-1 ring-emerald-200" aria-hidden="true">✓</div>
                  <div>
                    <p className="font-semibold text-slate-700">Pembayaran aman</p>
                    <p className="text-sm text-slate-600">Pilih metode pembayaran pada langkah berikutnya.</p>
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
              <button disabled={busy} className="sticky bottom-2 z-10 w-full min-h-12 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-transform duration-150 active:scale-[0.96] disabled:opacity-60">{busy ? 'Menyiapkan pembayaran...' : `Beli sekarang - ${fmt(total)}`}</button>
            </div>
          </fieldset>
          <p role="status" className="mt-3 min-h-5 text-sm text-slate-600">{busy ? 'Sedang menyiapkan pembayaran. Mohon tunggu...' : ''}</p>
        </form>
      </Modal>)}
  </>;
}
