'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BackButton } from '@/components/ui/back-button';
import WhatsAppBuyButton from '@/components/public/WhatsAppBuyButton';

const paymentLogos = [
  { name: 'QRIS', src: '/logos/qris.svg' },
  { name: 'GoPay', src: '/logos/gopay.svg' },
  { name: 'DANA', src: '/logos/dana.svg' },
  { name: 'OVO', src: '/logos/ovo.svg' },
  { name: 'ShopeePay', src: '/logos/shopeepay.svg' },
  { name: 'LinkAja', src: '/logos/linkaja.svg' },
  { name: 'BCA', src: '/logos/bca.svg' },
  { name: 'Mandiri', src: '/logos/mandiri.svg' },
  { name: 'BNI', src: '/logos/bni.svg' },
  { name: 'BRI', src: '/logos/bri.svg' },
  { name: 'BSI', src: '/logos/bsi.svg' },
  { name: 'Permata', src: '/logos/permata.svg' },
  { name: 'Alfamart', src: '/logos/alfamart.svg' },
  { name: 'Indomaret', src: '/logos/indomaret.svg' },
  { name: 'Visa', src: '/logos/visa.svg' },
  { name: 'Mastercard', src: '/logos/mastercard.svg' },
];

const MIN_PAYMENT = 1000;

function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

export default function CheckoutPage({ products, waUrl }) {
  const product = products[0];
  const isCart = products.length > 1;
  const backHref = isCart ? '/produk' : `/produk/${product.slug}`;
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherState, setVoucherState] = useState({ status: 'idle', message: '', discount: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const price = products.reduce((sum, p) => sum + Number(p.sale_price || 0), 0);
  const total = Math.max(0, price - voucherState.discount);
  const tooSmall = total > 0 && total < MIN_PAYMENT;

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
        body: JSON.stringify({ ...fields, product_ids: products.map((p) => p.id) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Pembayaran belum dapat diproses. Silakan coba lagi.');
      if (typeof data.redirect_url === 'string' && data.redirect_url.startsWith('/')) {
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

  return (
    <main className="min-h-screen overflow-x-clip bg-[#eef7f5] pb-4 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-3 sm:px-6">
          <BackButton href={backHref} label="Kembali" />
          <h1 className="text-base font-bold tracking-tight sm:text-lg">Checkout</h1>
          <Link href={backHref} aria-label="Tutup checkout" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-md shadow-red-500/30 ring-2 ring-red-100 transition hover:bg-red-600 active:scale-95"><svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></Link>
        </div>
      </header>


      <form onSubmit={submitCheckout} aria-busy={busy} className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 px-3 pt-3 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,.92fr)]">
        <div className="space-y-3">
          <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80 sm:p-4">
            {isCart && <p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">{products.length} produk di keranjang</p>}
            <ul className="divide-y divide-slate-100">
              {products.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-emerald-50 ring-1 ring-slate-200">
                    {item.cover_path ? <img src={item.cover_path} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs font-black text-emerald-700">BGY</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{item.title}</p>
                    <p className="text-xs text-slate-500">1x produk digital</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-emerald-600">{formatRupiah(item.sale_price)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80 sm:p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Data pembeli</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2"><span className="text-red-500">*</span> Email
                <input name="buyer_email" type="email" autoComplete="email" required maxLength={254} placeholder="nama@email.com" className="mt-1 block h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="text-sm font-semibold text-slate-700"><span className="text-red-500">*</span> Nama
                <input name="buyer_name" autoComplete="name" required maxLength={120} placeholder="Nama lengkap" className="mt-1 block h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="text-sm font-semibold text-slate-700"><span className="text-red-500">*</span> WhatsApp
                <input name="buyer_whatsapp" type="tel" autoComplete="tel" required pattern="[0-9+ \(\)\-]{8,25}" inputMode="tel" placeholder="08xxxxxxxxxx" className="mt-1 block h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80 sm:p-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-4"><span className="text-slate-500">Subtotal</span><span>{formatRupiah(price)}</span></div>
              <div className="flex justify-between gap-4 text-emerald-600"><span>Diskon</span><span>- {formatRupiah(voucherState.discount)}</span></div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 text-base font-bold"><span>Total</span><span>{formatRupiah(total)}</span></div>
            </div>
            <input type="hidden" name="voucher_code" value={voucherCode} />
            <button type="button" onClick={() => setVoucherOpen((value) => !value)} aria-expanded={voucherOpen} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500 px-4 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"><span aria-hidden="true">%</span>{voucherState.status === 'success' ? 'Ubah voucher' : 'Tambah voucher'}</button>
            {voucherOpen && <div className="mt-2 rounded-xl bg-emerald-50 p-2.5"><div className="flex gap-2"><input id="voucher-code" value={voucherCode} onChange={(event) => setVoucherCode(event.target.value.toUpperCase())} autoComplete="off" placeholder="Kode voucher" className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /><button type="button" onClick={applyVoucher} disabled={voucherState.status === 'loading'} className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white disabled:opacity-60">{voucherState.status === 'loading' ? 'Cek...' : 'Pakai'}</button></div>{voucherState.message && <p role={voucherState.status === 'error' ? 'alert' : 'status'} className={`mt-1.5 text-xs font-semibold ${voucherState.status === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{voucherState.message}</p>}</div>}
          </section>
        </div>

        <div className="space-y-3">
          <section className="rounded-2xl border border-emerald-300 bg-white p-3 shadow-sm sm:p-4">
            <p className="text-xs font-semibold text-slate-500">Metode pembayaran tersedia di halaman Mayar</p>
            <div className="mt-2 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {paymentLogos.map((logo) => (
                <div key={logo.name} title={logo.name} className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1">
                  <img src={logo.src} alt={logo.name} loading="lazy" className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80 sm:p-4">
            <label className="flex items-start gap-2 text-xs text-slate-700"><input required type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-600" /><span>Saya menyetujui <a href="/halaman/syarat-dan-ketentuan" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-700 underline underline-offset-2">Syarat dan Ketentuan</a>.</span></label>
          </section>

          {tooSmall && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Total pembayaran online minimal {formatRupiah(MIN_PAYMENT)}. {voucherState.discount > 0 ? 'Hapus atau ganti voucher.' : 'Hubungi admin untuk produk ini.'}</p>}
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-700">{error}</p>}
          <button disabled={busy || tooSmall} className="sticky bottom-2 z-10 h-12 w-full rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Memproses...' : total === 0 ? 'Ambil Gratis dengan Voucher' : `Beli sekarang - ${formatRupiah(total)}`}</button>
          <WhatsAppBuyButton waUrl={waUrl} product={isCart ? { title: products.map((p) => p.title).join(', '), sale_price: price } : product} />
        </div>
      </form>
    </main>
  );
}
