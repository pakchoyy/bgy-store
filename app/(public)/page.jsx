import LynkShell from '@/components/public/LynkShell'
import ProductStack from '@/components/public/ProductStack'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'
import { demoProducts } from '@/lib/demo-data'
import Testimonials from '@/components/public/Testimonials'

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

  const { createTrustedServerClient } = await import('@/lib/supabase-server')
  const trusted = await createTrustedServerClient()
  const reviewQuery = (columns) => trusted
    .from('product_reviews')
    .select(columns)
    .eq('is_approved', true)
    .gte('rating', 4)
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(8)
  let { data: reviews, error } = await reviewQuery('id, reviewer_name, reviewer_institution, rating, comment, product:products(title)')
  if (error) ({ data: reviews } = await reviewQuery('id, reviewer_name, rating, comment, product:products(title)'))

  return { ...shell, products, reviews: (reviews || []).filter((r) => String(r.comment || '').trim().length >= 10) }
}

export default async function HomePage() {
  const { navItems, appearance, footerConfig, announcement, products, contentBlocks, reviews = [] } = await getData()

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
      <Testimonials reviews={reviews} />
    </LynkShell>
  )
}
