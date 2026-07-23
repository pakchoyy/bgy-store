import LynkShell from '@/components/public/LynkShell'
import ProductStack from '@/components/public/ProductStack'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'
import { demoProducts, demoCategories } from '@/lib/demo-data'

async function getData() {
  if (!hasSupabase()) {
    return demoShellData({
      products: demoProducts.filter((p) => p.is_active),
      categories: demoCategories,
    })
  }
  return fetchStoreShell()
}

export default async function CariPage({ searchParams }) {
  const { q = '', type: filterType = '', category: filterCategory = '' } = searchParams || {}
  const data = await getData()
  const { products, categories, navItems, appearance, footerConfig, announcement } = data

  const filtered = (products || []).filter((p) => {
    if (q) {
      const sq = q.toLowerCase()
      if (!p.title.toLowerCase().includes(sq) && !(p.description || '').toLowerCase().includes(sq)) {
        return false
      }
    }
    if (filterType && p.type !== filterType) return false
    if (filterCategory && p.category_id !== filterCategory && p.category?.slug !== filterCategory) {
      return false
    }
    return true
  })

  return (
    <LynkShell
      appearance={appearance}
      navItems={navItems}
      footerConfig={footerConfig}
      announcement={announcement}
      activeTabLabel={q ? `Cari: ${q}` : 'Cari'}
    >
      <div className="space-y-3">
        <form action="/cari" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Cari produk..."
            className="w-full px-4 py-2.5 bg-white/95 border border-white/60 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </form>

        {(categories || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(categories || []).map((cat) => {
              const active = filterCategory === cat.id || filterCategory === cat.slug
              const params = new URLSearchParams()
              if (q) params.set('q', q)
              if (filterType) params.set('type', filterType)
              if (!active) params.set('category', cat.slug)
              return (
                <a
                  key={cat.id}
                  href={`/cari?${params.toString()}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    active ? 'bg-white text-[#0d7a8a] shadow' : 'bg-white/20 text-white'
                  }`}
                >
                  {cat.name}
                </a>
              )
            })}
          </div>
        )}

        <ProductStack products={filtered} emptyText="Tidak ada hasil" />
      </div>
    </LynkShell>
  )
}
