import Link from 'next/link'
import CategoryBadge from './CategoryBadge'
import { getCardLayout } from '@/lib/utils'

export default function ProductCard({ product, className = '' }) {
  const layout = getCardLayout(product.card_layout)
  const href = product.type === 'free' ? `/free` : `/produk/${product.slug}`

  if (layout.value === 'compact') {
    return (
      <Link
        href={href}
        className={`group bg-white rounded-2xl shadow-sm hover:shadow-md border border-white/60 transition-all duration-200 overflow-hidden flex items-center gap-3 p-3 ${className}`}
      >
        <div
          className={`w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden ${
            product.type === 'free'
              ? 'bg-gradient-to-br from-sky-400 to-sky-600'
              : 'bg-gradient-to-br from-amber-400 to-orange-500'
          }`}
        >
          {product.cover_path ? (
            <img src={product.cover_path} alt="" className="w-full h-full object-cover" />
          ) : product.type === 'free' ? (
            'FREE'
          ) : (
            'PAID'
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-[#0ea5a0] transition-colors">
            {product.title}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            {product.type === 'free' ? (
              <span className="text-xs font-extrabold text-[#0ea5a0]">GRATIS</span>
            ) : (
              <>
                <span className="text-xs font-extrabold text-[#0ea5a0]">
                  Rp{(product.sale_price || 0).toLocaleString('id-ID')}
                </span>
                {product.original_price ? (
                  <span className="text-[10px] line-through text-gray-400">
                    Rp{product.original_price.toLocaleString('id-ID')}
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
      className={`group bg-white rounded-2xl shadow-sm hover:shadow-md border border-white/60 transition-all duration-200 overflow-hidden flex flex-col ${className}`}
    >
      <div className={`${layout.aspect} bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden`}>
        {product.cover_path ? (
          <img
            src={product.cover_path}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center text-white font-extrabold text-sm ${
              product.type === 'free'
                ? 'bg-gradient-to-br from-sky-400 to-sky-600'
                : 'bg-gradient-to-br from-amber-400 to-orange-500'
            }`}
          >
            {product.type === 'free' ? 'GRATIS' : 'PAID'}
          </div>
        )}

        {product.badge && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            {product.badge === 'custom' ? product.badge_custom : product.badge}
          </span>
        )}

        {product.category && (
          <div className="absolute top-2 right-2">
            <CategoryBadge category={product.category} />
          </div>
        )}
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-[#0ea5a0] transition-colors duration-200">
          {product.title}
        </h3>

        {product.description && layout.value !== 'wide' && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2 flex-1">
            {product.description.replace(/<[^>]*>/g, '').slice(0, 100)}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          {product.type === 'free' ? (
            <span className="text-xs font-extrabold text-[#0ea5a0]">GRATIS</span>
          ) : (
            <div className="flex items-center gap-1.5">
              {product.original_price ? (
                <>
                  <span className="text-[10px] line-through text-gray-400">
                    Rp{product.original_price.toLocaleString('id-ID')}
                  </span>
                  <span className="text-sm font-extrabold text-red-500">
                    Rp{(product.sale_price || 0).toLocaleString('id-ID')}
                  </span>
                </>
              ) : (
                <span className="text-sm font-extrabold text-gray-900">
                  Rp{(product.sale_price || 0).toLocaleString('id-ID')}
                </span>
              )}
            </div>
          )}
          {product.file_size && (
            <span className="text-[10px] text-gray-400">{product.file_size}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
