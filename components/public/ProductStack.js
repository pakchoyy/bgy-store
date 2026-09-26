import ProductCard from '@/components/public/ProductCard'
import ContentBlockCard from '@/components/public/ContentBlockCard'
import { getCardLayout } from '@/lib/utils'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

function StaticWrap({ className, children }) {
  return <div className={className}>{children}</div>
}

function mergeItems(products, contentBlocks) {
  const blocks = [...contentBlocks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  if (!blocks.length) return products.map((p) => ({ ...p, _kind: 'product' }))

  const result = []
  let bi = 0
  for (const p of products) {
    while (bi < blocks.length && (blocks[bi].sort_order || 0) <= (p.sort_order || 0)) {
      result.push({ ...blocks[bi], _kind: 'block' })
      bi++
    }
    result.push({ ...p, _kind: 'product' })
  }
  while (bi < blocks.length) {
    result.push({ ...blocks[bi], _kind: 'block' })
    bi++
  }
  return result
}

export default function ProductStack({ products = [], contentBlocks = [], emptyText = 'Belum ada produk', animate = true }) {
  const items = mergeItems(products, contentBlocks)
  const Wrap = animate ? ScrollReveal : StaticWrap

  if (!items.length) {
    return (
      <div className="bg-white/90 rounded-2xl p-8 text-center text-sm text-gray-500 shadow-sm">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, index) => {
        if (item._kind === 'block') {
          return (
            <Wrap key={`block-${item.id}`} className="col-span-2" delay={Math.min(index, 8) * 45}>
              <ContentBlockCard block={item} />
            </Wrap>
          )
        }

        const layout = getCardLayout(item.card_layout)
        const span =
          layout.value === 'landscape' || layout.value === 'wide' || layout.value === 'compact'
            ? 'col-span-2'
            : 'col-span-1'

        return (
          <Wrap key={`product-${item.id}`} className={span} delay={Math.min(index, 8) * 45}>
            <ProductCard product={item} />
          </Wrap>
        )
      })}
    </div>
  )
}
