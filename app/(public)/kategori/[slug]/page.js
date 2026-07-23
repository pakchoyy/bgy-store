import LynkShell from '@/components/public/LynkShell'
import ProductStack from '@/components/public/ProductStack'
import Link from 'next/link'
import { demoProducts, demoCategories } from '@/lib/demo-data'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'

async function getData(slug) {
  if (!hasSupabase()) {
    const category = demoCategories.find((c) => c.slug === slug)
    if (!category) return { ...demoShellData(), category: null, products: [] }
    return {
      ...demoShellData(),
      category,
      products: demoProducts.filter((p) => p.category_id === category.id && p.is_active),
    }
  }

  const shell = await fetchStoreShell()
  const category = (shell.categories || []).find((c) => c.slug === slug)
  if (!category) return { ...shell, category: null, products: [] }

  return {
    ...shell,
    category,
    products: (shell.products || []).filter((p) => p.category_id === category.id),
  }
}

export default async function KategoriPage({ params }) {
  const { slug } = params
  const data = await getData(slug)
  const { category, products, navItems, appearance, footerConfig, announcement } = data

  if (!category) {
    return (
      <LynkShell appearance={appearance} navItems={navItems} footerConfig={footerConfig} announcement={announcement}>
        <div className="bg-white/95 rounded-2xl p-8 text-center shadow-sm">
          <h1 className="text-lg font-extrabold text-gray-900 mb-2">Kategori Tidak Ditemukan</h1>
          <Link href="/" className="text-sm font-bold text-[#0ea5a0]">
            Kembali ke Home
          </Link>
        </div>
      </LynkShell>
    )
  }

  return (
    <LynkShell
      appearance={appearance}
      navItems={navItems}
      footerConfig={footerConfig}
      announcement={announcement}
      activeTabLabel={category.name}
    >
      <ProductStack products={products} emptyText="Belum ada produk di kategori ini" />
    </LynkShell>
  )
}
