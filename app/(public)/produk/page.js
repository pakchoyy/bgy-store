import LynkShell from '@/components/public/LynkShell'
import ProdukFilter from '@/components/public/ProdukFilter'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'
import { demoProducts, demoCategories } from '@/lib/demo-data'

export const metadata = {
  title: 'Produk | Kreacy',
  description: 'Produk digital berbayar untuk guru dan pendidik: modul ajar, media pembelajaran, dan administrasi.',
}

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

export const revalidate = 30
export const dynamic = 'force-static'

export default async function ProdukPage() {
  const data = await getData()
  const { products, categories, navItems, appearance, footerConfig, announcement } = data
  const paidCategories = (categories || []).filter((c) =>
    products.some((p) => p.category_id === c.id)
  )

  return (
    <LynkShell
      appearance={appearance}
      navItems={navItems}
      footerConfig={footerConfig}
      announcement={announcement}
      topBarTitle="Produk"
      activeTabLabel="Produk"
    >
      <ProdukFilter products={products} categories={paidCategories} />
    </LynkShell>
  )
}
