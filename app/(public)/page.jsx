import LynkShell from '@/components/public/LynkShell'
import ProductStack from '@/components/public/ProductStack'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'
import { demoProducts } from '@/lib/demo-data'

export const dynamic = 'force-dynamic'

async function getData() {
  if (!hasSupabase()) {
    const saved = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('_bgym_demo_products') || '[]') : []
    const allProducts = saved.length ? saved : demoProducts
    return demoShellData({
      products: allProducts.filter((p) => p.is_active).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    })
  }

  const shell = await fetchStoreShell()
  const products = (shell.products || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  return { ...shell, products }
}

export default async function HomePage() {
  const { navItems, appearance, footerConfig, announcement, products, contentBlocks } = await getData()

  return (
    <LynkShell
      appearance={appearance}
      navItems={navItems}
      footerConfig={footerConfig}
      announcement={announcement}
      activeTabLabel="Last Updated 👇"
      topBarTitle="Home"
    >
      <ProductStack products={products} contentBlocks={contentBlocks} emptyText="Belum ada produk ditampilkan" />
    </LynkShell>
  )
}
