import LynkShell from '@/components/public/LynkShell'
import ProductStack from '@/components/public/ProductStack'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'
import { demoProducts } from '@/lib/demo-data'

async function getData() {
  if (!hasSupabase()) {
    const featured = demoProducts.filter((p) => p.is_active && (p.is_featured || p.type === 'paid'))
    const rest = demoProducts.filter((p) => p.is_active && !featured.find((f) => f.id === p.id))
    return demoShellData({
      products: [...featured, ...rest].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    })
  }

  const shell = await fetchStoreShell()
  const products = (shell.products || [])
    .slice()
    .sort((a, b) => {
      if (!!b.is_featured !== !!a.is_featured) return b.is_featured ? 1 : -1
      return (a.sort_order || 0) - (b.sort_order || 0)
    })

  return { ...shell, products }
}

export default async function HomePage() {
  const { navItems, appearance, footerConfig, announcement, products } = await getData()

  return (
    <LynkShell
      appearance={appearance}
      navItems={navItems}
      footerConfig={footerConfig}
      announcement={announcement}
      activeTabLabel="Home"
    >
      <ProductStack products={products} emptyText="Belum ada produk ditampilkan" />
    </LynkShell>
  )
}
