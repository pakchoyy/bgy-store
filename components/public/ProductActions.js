'use client';
import { useState } from 'react';
import DownloadModal from './DownloadModal';
import BuyModal from './BuyModal';
import StickyBuyBar from './StickyBuyBar';
import { addCartItem } from '@/lib/cart';

export default function ProductActions({ product, settings, waUrl }) {
  const [open, setOpen] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const soldOut = product.stock_type === 'limited' && product.stock_qty <= 0;
  const isFree = product.type === 'free';
  const openOrder = () => {
    if (!soldOut) setOpen(true);
  };
  const addToCart = () => {
    if (soldOut || isFree) return;
    addCartItem(product);
    setCartMessage('Produk masuk keranjang.');
  };
  return <>
    <div className={!isFree && !soldOut ? 'grid gap-3 sm:grid-cols-[1fr_auto]' : ''}>
      <button type="button" id="main-buy-button" data-track-click data-product-id={product.id} disabled={soldOut} onClick={openOrder} className={`relative z-10 w-full min-h-12 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-transform duration-150 active:scale-[0.96] disabled:bg-gray-400 disabled:shadow-none bg-emerald-500 hover:bg-emerald-600 shadow-emerald-600/25`}>{soldOut ? 'Stok Habis' : isFree ? 'Download Gratis' : product.purchase_button_label || 'Beli Sekarang'}</button>
      {!isFree && !soldOut && (
          <button type="button" onClick={addToCart} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-brand-dark/20 bg-white px-5 py-3 text-sm font-semibold text-brand-dark shadow-sm transition-[background-color,transform] duration-150 hover:bg-teal-50 active:scale-[0.96]" aria-label={`Tambah ${product.title} ke keranjang`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20 8H7M12 10v4M10 12h4M10 21h.01M17 21h.01" />
          </svg>
          Keranjang
        </button>
      )}
    </div>
    {!isFree && !soldOut && waUrl && (
      <a
        href={`${waUrl}${waUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent(`Halo Pak Choy, saya mau beli *${product.title}* (Rp${Number(product.sale_price || 0).toLocaleString('id-ID')}). Bagaimana caranya?`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.5-.3z" /></svg>
        Bingung? Beli via WhatsApp
      </a>
    )}
    {!soldOut && <p role="status" className="mt-2 text-center text-xs text-slate-500">{cartMessage || (isFree ? 'File disiapkan langsung dari halaman ini.' : 'Bisa beli langsung atau simpan dulu ke keranjang.')}</p>}
    <StickyBuyBar product={product} onBuy={openOrder} onAddToCart={addToCart} />
    {open && isFree && <DownloadModal product={product} settings={settings} isOpen onClose={() => setOpen(false)} />}
    {open && !isFree && <BuyModal product={product} isOpen onClose={() => setOpen(false)} />}
  </>;
}
