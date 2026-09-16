import Link from 'next/link'
import { getCardLayout } from '@/lib/utils'

export default function ProductCard({ product, className = '' }) {
  const layout = getCardLayout(product.card_layout)
  const isFree = product.type === 'free'
  const isSoldOut = product.stock_type === 'limited' && product.stock_qty <= 0
  const href = isFree ? `/free` : `/produk/${product.slug}`
  const fmt = (value) => `Rp${Number(value || 0).toLocaleString('id-ID')}`

  if (layout.value === 'compact') {
    return (
      <Link
        href={href}
        className={`group bg-white rounded-2xl shadow-sm hover:shadow-md border border-white/60 transition-[transform,box-shadow] duration-150 overflow-hidden flex items-center gap-3 p-3 active:scale-[0.96] ${className}`}
      >
        <div
          className={`w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden ${
            isFree
              ? 'bg-gradient-to-br from-sky-400 to-sky-600'
              : 'bg-gradient-to-br from-amber-400 to-orange-500'
          }`}
        >
          {product.cover_path ? (
            <img src={product.cover_path} alt="" className="w-full h-full object-cover" />
          ) : isFree ? (
            'FREE'
          ) : (
            'PAID'
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#0ea5a0] transition-colors">
            {product.title}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            {isFree ? (
              <span className="text-xs font-semibold text-[#0ea5a0]">GRATIS</span>
            ) : (
              <>
                <span className="text-xs font-semibold text-[#0ea5a0]">
                  {fmt(product.sale_price)}
                </span>
                {product.original_price ? (
                  <span className="text-[10px] line-through text-gray-400">
                    {fmt(product.original_price)}
                  </span>
                ) : null}
              </>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={`group relative bg-white rounded-[1.35rem] shadow-sm hover:shadow-md border border-white/60 transition-[transform,box-shadow] duration-150 overflow-hidden flex flex-col active:scale-[0.96] ${className}`}
    >
      {!isFree && <div className="absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-r from-amber-400 to-orange-500" />}
      <div className={`${layout.aspect} bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden`}>
        {product.cover_path ? (
          <img
            src={product.cover_path}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center text-white font-bold text-sm ${
              isFree
                ? 'bg-gradient-to-br from-sky-400 to-sky-600'
                : 'bg-gradient-to-br from-amber-400 to-orange-500'
            }`}
          >
            {isFree ? 'GRATIS' : 'PAID'}
          </div>
        )}

        {product.badge && (
          <span className="absolute top-3 left-3 z-20 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-sm">
            {product.badge === 'custom' ? product.badge_custom : product.badge}
          </span>
        )}
        {!isFree && <span className="absolute top-1.5 left-1/2 z-20 -translate-x-1/2 text-[11px] font-semibold tracking-wide text-white">PAID</span>}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {product.category && (
            <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-bold text-[#0d7a8a]">
              {product.category.name}
            </span>
          )}
          {isSoldOut && <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">Stok habis</span>}
        </div>
        <h3 className="text-base font-semibold text-gray-950 line-clamp-2 mb-1 group-hover:text-[#0ea5a0] transition-colors duration-150">
          {product.title}
        </h3>

        {product.description && layout.value !== 'wide' && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
            {product.description.replace(/<[^>]*>/g, '').slice(0, 120)}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100">
          {isFree ? (
            <span className="text-base font-semibold text-[#0ea5a0]">Gratis</span>
          ) : (
            <div>
              {product.original_price && product.original_price > product.sale_price ? (
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs line-through text-gray-400 font-semibold">
                    {fmt(product.original_price)}
                  </span>
                  <span className="text-lg font-semibold text-red-500">
                    {fmt(product.sale_price)}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-semibold text-gray-950">
                  {fmt(product.sale_price)}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500">{isFree ? 'Gratis' : 'Digital'}</span>
            <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white group-hover:bg-[#0d7a8a]">
              {isSoldOut ? 'Detail' : isFree ? 'Download' : 'Beli'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
