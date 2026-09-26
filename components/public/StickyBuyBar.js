'use client';

import { useEffect, useRef, useState } from 'react';

export default function StickyBuyBar({ product, onAddToCart }) {
  const [visible, setVisible] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    const btn = document.getElementById('main-buy-button');
    if (!btn) return;

    btnRef.current = btn;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' }
    );

    observer.observe(btn);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  const isSoldOut = product.stock_type === 'limited' && product.stock_qty <= 0;
  const isFree = product.type === 'free';

  const fmt = (val) => `Rp${Number(val).toLocaleString('id-ID')}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur animate-slideUp md:bottom-4 md:left-1/2 md:right-auto md:w-[min(100%-2rem,42rem)] md:-translate-x-1/2 md:rounded-2xl md:border md:shadow-2xl">
      <div className="flex items-center justify-between gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="min-w-0">
          {product.original_price && product.original_price > product.sale_price ? (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-numeric text-xs line-through text-gray-400">{fmt(product.original_price)}</span>
              <span className="font-numeric text-base font-semibold text-rose-600">{fmt(product.sale_price)}</span>
            </div>
          ) : product.sale_price === 0 ? (
            <span className="text-base font-semibold text-[#0ea5a0]">Gratis</span>
          ) : (
            <span className="font-numeric text-base font-semibold text-gray-900">{fmt(product.sale_price)}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isFree && !isSoldOut && (
            <button
              type="button"
              onClick={onAddToCart}
              aria-label={`Masukkan ${product.title} ke keranjang`}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#0ea5a0]/25 bg-[#0ea5a0]/10 text-[#0d7a8a] transition-transform duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5a0] focus-visible:ring-offset-2"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20 8H7m5 2v4m-2-2h4M10 21h.01M17 21h.01" />
              </svg>
            </button>
          )}
          <button
            onClick={() => btnRef.current?.click()}
            disabled={isSoldOut}
            className={`min-h-12 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 ${
              isSoldOut
                ? 'bg-gray-300 cursor-not-allowed'
                : product.type === 'free'
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-sm active:scale-[0.96]'
                  : 'bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/30 active:scale-[0.96]'
            }`}
          >
            {isSoldOut ? 'Stok Habis' : product.purchase_button_label || 'Beli Sekarang'}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
