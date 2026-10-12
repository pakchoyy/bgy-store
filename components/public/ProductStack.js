import ProductCard from '@/components/public/ProductCard'
import ContentBlockCard from '@/components/public/ContentBlockCard'
import { getCardLayout } from '@/lib/utils'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import ShowMore from '@/components/public/ShowMore'

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

  // Kelompokkan per blok: blok dengan collapse_after hanya menampilkan N produk pertama di bawahnya.
  const nodes = []
  let limit = null
  let shown = 0
  let hidden = []
  const flush = () => {
    if (hidden.length) nodes.push(<ShowMore key={`more-${nodes.length}`} count={hidden.length}>{hidden}</ShowMore>)
    hidden = []
  }

  items.forEach((item, index) => {
    if (item._kind === 'block') {
      flush()
      limit = item.collapse_after || null
      shown = 0
      nodes.push(
        <Wrap key={`block-${item.id}`} className="col-span-6" delay={Math.min(index, 8) * 45}>
          <ContentBlockCard block={item} />
        </Wrap>
      )
      return
    }
    const node = (
      <Wrap key={`product-${item.id}`} className={getCardLayout(item.card_layout).grid} delay={Math.min(index, 8) * 45}>
        <ProductCard product={item} />
      </Wrap>
    )
    if (limit && shown >= limit) hidden.push(node)
    else { nodes.push(node); shown++ }
  })
  flush()

  return <div className="grid grid-cols-6 gap-2.5">{nodes}</div>
}
