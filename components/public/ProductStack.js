import ProductCard from '@/components/public/ProductCard'
import { getCardLayout } from '@/lib/utils'

export default function ProductStack({ products = [], emptyText = 'Belum ada produk' }) {
  if (!products.length) {
    return (
      <div className="bg-white/90 rounded-2xl p-8 text-center text-sm text-gray-500 shadow-sm">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((product) => {
        const layout = getCardLayout(product.card_layout)
        const span =
          layout.value === 'landscape' || layout.value === 'wide' || layout.value === 'compact'
            ? 'col-span-2'
            : 'col-span-1'

        return (
          <div key={product.id} className={span}>
            <ProductCard product={product} />
          </div>
        )
      })}
    </div>
  )
}
