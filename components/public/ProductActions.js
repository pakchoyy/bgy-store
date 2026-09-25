'use client';
import { useState } from 'react';
import DownloadModal from './DownloadModal';
import BuyModal from './BuyModal';
import StickyBuyBar from './StickyBuyBar';
import { addCartItem } from '@/lib/cart';

export default function ProductActions({ product, settings }) {
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
    {open && isFree && <DownloadModal product={product} settings={settings} isOpen onClose={() => setOpen(false)} />}
    {open && !isFree && <BuyModal product={product} isOpen onClose={() => setOpen(false)} />}
  </>;
}
