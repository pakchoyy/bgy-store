'use client';

import { useEffect, useRef, useState } from 'react';

export default function StickyBuyBar({ product, onBuy }) {
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

  const fmt = (val) => `Rp${Number(val).toLocaleString('id-ID')}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg md:hidden animate-slideUp">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          {product.original_price && product.original_price > product.sale_price ? (
            <div className="flex items-baseline gap-2">
              <span className="text-xs line-through text-gray-400">{fmt(product.original_price)}</span>
              <span className="text-base font-bold text-red-500">{fmt(product.sale_price)}</span>
            </div>
          ) : product.sale_price === 0 ? (
            <span className="text-base font-bold text-[#0ea5a0]">Gratis</span>
          ) : (
            <span className="text-base font-bold text-gray-900">{fmt(product.sale_price)}</span>
          )}
        </div>
        <button
          onClick={onBuy}
          disabled={isSoldOut}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 ${
            isSoldOut
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] hover:shadow-md active:scale-[0.98]'
          }`}
        >
          {isSoldOut ? 'Sold Out' : 'Beli Sekarang'}
        </button>
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
