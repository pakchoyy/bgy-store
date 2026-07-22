import Link from 'next/link';
import CategoryBadge from './CategoryBadge';

export default function ProductCard({ product }) {
  return (
    <Link
      href={product.type === 'free' ? `/free` : `/produk/${product.slug}`}
      className="group bg-white rounded-xl shadow-card hover:shadow-card-lg transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        {product.cover_path ? (
          <img
            src={product.cover_path}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
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

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-[#0ea5a0] transition-colors duration-200">
          {product.title}
        </h3>

        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
            {product.description.replace(/<[^>]*>/g, '').slice(0, 120)}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          {product.type === 'free' ? (
            <span className="text-xs font-semibold text-[#0ea5a0]">Gratis</span>
          ) : (
            <div>
              {product.original_price ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs line-through text-gray-400">
                    Rp{product.original_price.toLocaleString('id-ID')}
                  </span>
                  <span className="text-sm font-bold text-red-500">
                    Rp{product.sale_price.toLocaleString('id-ID')}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-bold text-gray-900">
                  Rp{product.sale_price.toLocaleString('id-ID')}
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
  );
}
