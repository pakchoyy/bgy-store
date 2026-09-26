import Link from 'next/link'
import { getCardLayout } from '@/lib/utils'

const fmt = (value) => `Rp${Number(value || 0).toLocaleString('id-ID')}`

function PricePill({ product, isFree, isSoldOut, className = '' }) {
  const hasDiscount = !isFree && product.original_price && product.original_price > product.sale_price
  return (
    <span className={`flex shrink-0 flex-col items-end gap-0.5 ${className}`}>
      {product.flash_active && !isSoldOut && (
        <span className="rounded-md bg-gradient-to-r from-amber-400 to-orange-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">⚡ Flash sale</span>
      )}
      {hasDiscount && !isSoldOut && (
        <span className="font-numeric text-[10px] font-semibold text-gray-500 line-through">{fmt(product.original_price)}</span>
      )}
      <span
        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
          isSoldOut
            ? 'bg-gray-400 text-white'
            : isFree
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-300'
              : 'bg-emerald-700 text-white shadow-sm shadow-emerald-600/30'
        }`}
      >
        {isSoldOut ? 'Habis' : isFree ? 'Gratis' : fmt(product.sale_price)}
      </span>
    </span>
  )
}

function DownloadCount({ product, isFree }) {
  const count = Number(product.download_count || 0)
  if (!isFree || count < 1) return null
  return <span className="block text-[11px] font-medium text-gray-500">{count.toLocaleString('id-ID')}× diunduh</span>
}

function Thumb({ product, isFree, className, large = false }) {
  if (product.cover_path) {
    return (
      <span className={`flex shrink-0 overflow-hidden bg-gray-100 ${className}`}>
        <img src={product.cover_path} alt="" loading="lazy" className="h-full w-full object-cover" />
      </span>
    )
  }
  return (
    <span className={`relative flex shrink-0 flex-col items-center justify-center overflow-hidden text-white ${className} ${
      isFree ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 'bg-gradient-to-br from-teal-600 to-[#123b35]'
    }`}>
      <span className="absolute -right-3 -top-3 h-10 w-10 rounded-full bg-white/15" aria-hidden="true" />
      <svg aria-hidden="true" className={large ? 'h-8 w-8' : 'h-5 w-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 3v4a1 1 0 001 1h4M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM9 13h6M9 17h4" />
      </svg>
      {large && <span className="mt-2 line-clamp-2 px-3 text-center text-xs font-bold leading-snug text-white/95">{product.title}</span>}
      <span className={`font-bold uppercase tracking-wider text-white/80 ${large ? 'mt-1 text-[9px]' : 'mt-0.5 text-[8px]'}`}>{isFree ? 'Gratis' : 'Premium'}</span>
    </span>
  )
}

export default function ProductCard({ product, onSelect, className = '' }) {
  const layout = getCardLayout(product.card_layout)
  const isFree = product.type === 'free'
  const isSoldOut = product.stock_type === 'limited' && product.stock_qty <= 0
  const highlight = product.is_featured ? 'bgy-highlight-block' : ''
  const isRow = layout.value === 'landscape' || layout.value === 'compact'

  const base = `group block w-full text-left bg-white shadow-sm hover:shadow-md transition-[transform,box-shadow] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5a0] focus-visible:ring-offset-2 ${highlight} ${className}`

  const content = isRow ? (
    <span className={`flex items-center ${layout.value === 'compact' ? 'gap-2.5' : 'gap-3'}`}>
      <Thumb product={product} isFree={isFree} className={layout.value === 'compact' ? 'h-11 w-11 rounded-lg' : 'h-14 w-14 rounded-xl'} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug text-gray-900 line-clamp-2">{product.title}</span>
        <DownloadCount product={product} isFree={isFree} />
      </span>
      <PricePill product={product} isFree={isFree} isSoldOut={isSoldOut} />
    </span>
  ) : (
    <span className="flex h-full flex-col">
      <span className={`relative block overflow-hidden ${layout.aspect}`}>
        <Thumb product={product} isFree={isFree} className="h-full w-full" large />
      </span>
      <span className={`flex flex-1 gap-2 p-2.5 ${layout.value === 'wide' ? 'items-center' : 'flex-col'}`}>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold leading-snug text-gray-900 line-clamp-2">{product.title}</span>
          <DownloadCount product={product} isFree={isFree} />
        </span>
        <PricePill product={product} isFree={isFree} isSoldOut={isSoldOut} className={layout.value === 'wide' ? '' : 'items-start'} />
      </span>
    </span>
  )

  const shape = isRow ? (layout.value === 'compact' ? 'rounded-xl p-2' : 'rounded-2xl p-2.5') : 'h-full overflow-hidden rounded-2xl'

  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(product)} data-track-click data-product-id={product.id} className={`${base} ${shape}`}>
        {content}
      </button>
    )
  }

  return (
    <Link href={`/produk/${product.slug}`} data-track-click data-product-id={product.id} className={`${base} ${shape}`}>
      {content}
    </Link>
  )
}
