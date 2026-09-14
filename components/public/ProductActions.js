'use client';
import { useRef, useState } from 'react';
import Modal from './Modal';
import DownloadModal from './DownloadModal';
import StickyBuyBar from './StickyBuyBar';

export default function ProductActions({ product, settings }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const soldOut = product.stock_type === 'limited' && product.stock_qty <= 0;
  const isFree = product.type === 'free';
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
      <Modal closeDisabled={busy} title="Lengkapi pesanan" onClose={() => { if (!busy) setOpen(false); }}>
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 mb-5">
          <p className="text-sm font-semibold text-gray-900">{product.title}</p>
          <p className="font-extrabold text-xl text-brand-dark mt-1">Rp{Number(product.sale_price).toLocaleString('id-ID')}</p>
        </div>
        <form onSubmit={checkout} aria-busy={busy}><fieldset disabled={busy} className="space-y-4">
          <label className="block text-sm font-medium">Nama lengkap<input name="buyer_name" autoComplete="name" required maxLength={120} className="mt-1 block w-full rounded-lg border p-3 text-base disabled:bg-slate-100" /></label>
          <label className="block text-sm font-medium">Nomor WhatsApp<input name="buyer_whatsapp" type="tel" autoComplete="tel" required pattern="[+0-9 ()-]{8,25}" placeholder="Contoh: 081234567890" className="mt-1 block w-full rounded-lg border p-3 text-base disabled:bg-slate-100" /></label>
          <label className="block text-sm font-medium">Email <span className="text-gray-400 font-normal">(opsional)</span><input name="buyer_email" type="email" autoComplete="email" maxLength={254} className="mt-1 block w-full rounded-lg border p-3 text-base disabled:bg-slate-100" /></label>
          <p className="text-sm text-gray-600">Anda akan melanjutkan ke Mayar untuk memilih metode pembayaran. Biaya tambahan, jika ada, ditampilkan di sana.</p>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="w-full min-h-12 rounded-xl bg-brand-dark px-4 py-3 text-white font-bold transition-transform duration-150 active:scale-[0.96] disabled:opacity-60">{busy ? 'Menyiapkan pembayaran...' : 'Lanjut Bayar'}</button>
        </fieldset><p role="status" className="mt-3 text-sm text-slate-600">{busy ? "Sedang menyiapkan pembayaran. Mohon tunggu…" : ""}</p></form>
      </Modal>)}
  </>;
}
