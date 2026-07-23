import LynkShell from '@/components/public/LynkShell'
import ProductStack from '@/components/public/ProductStack'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'
import { demoProducts, demoCategories } from '@/lib/demo-data'

async function getData() {
  if (!hasSupabase()) {
    return demoShellData({
      products: demoProducts.filter((p) => p.type === 'paid' && p.is_active),
      categories: demoCategories,
    })
  }

  const shell = await fetchStoreShell()
  return {
    ...shell,
    products: (shell.products || []).filter((p) => p.type === 'paid'),
  }
}

export default async function ProdukPage({ searchParams }) {
  const data = await getData()
  const { products, categories, navItems, appearance, footerConfig, announcement } = data
  const q = searchParams?.q || ''
  const cat = searchParams?.category || ''

  let filtered = products
  if (cat) {
    filtered = filtered.filter((p) => p.category_id === cat || p.category?.slug === cat)
  }
  if (q) {
    const sq = q.toLowerCase()
    filtered = filtered.filter((p) => p.title.toLowerCase().includes(sq))
  }

  const paidCategories = (categories || []).filter((c) =>
    products.some((p) => p.category_id === c.id)
  )

  return (
    <LynkShell
      appearance={appearance}
      navItems={navItems}
      footerConfig={footerConfig}
      announcement={announcement}
      activeTabLabel="Produk"
    >
      <div className="space-y-3">
        <form action="/produk" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Cari produk..."
            className="w-full px-4 py-2.5 bg-white/95 border border-white/60 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
          />
        </form>

        {paidCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <a
              href="/produk"
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                !cat ? 'bg-white text-[#0d7a8a] shadow' : 'bg-white/20 text-white'
              }`}
            >
              Semua
            </a>
            {paidCategories.map((c) => (
              <a
                key={c.id}
                href={`/produk?${new URLSearchParams({ ...(q && { q }), category: c.slug }).toString()}`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  cat === c.slug || cat === c.id
                    ? 'bg-white text-[#0d7a8a] shadow'
                    : 'bg-white/20 text-white'
                }`}
              >
                {c.name}
              </a>
            ))}
          </div>
        )}

        <ProductStack products={filtered} emptyText="Tidak ada produk ditemukan" />
      </div>
    </LynkShell>
  )
}
