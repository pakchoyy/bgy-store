import LynkShell from '@/components/public/LynkShell'
import ProductStack from '@/components/public/ProductStack'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'
import { demoProducts } from '@/lib/demo-data'
import Testimonials from '@/components/public/Testimonials'

export const revalidate = 30
// Data toko sama untuk semua pengunjung; tanpa ini fetch Supabase membuat halaman selalu dinamis.
export const dynamic = 'force-static'

async function getData() {
  if (!hasSupabase()) {
    const saved = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('_bgym_demo_products') || '[]') : []
    const allProducts = saved.length ? saved : demoProducts
    return demoShellData({
      products: allProducts.filter((p) => p.is_active).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    })
  }

  const shell = await fetchStoreShell()
  const products = (shell.products || []).filter((p) => p.show_on_home !== false).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  const { unstable_cache } = await import('next/cache')
  const reviews = await unstable_cache(fetchHomeReviews, ['home-reviews-v1'], { revalidate: 300, tags: ['store'] })()

  return { ...shell, products, reviews: reviews.filter((r) => String(r.comment || '').trim().length >= 10) }
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

// Dibaca tanpa cookie lalu di-cache supaya Beranda bisa disajikan statis dari CDN.
async function fetchHomeReviews() {
  const { createClient } = await import('@supabase/supabase-js')
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const reviewQuery = (columns) => db
    .from('product_reviews')
    .select(columns)
    .eq('is_approved', true)
    .gte('rating', 4)
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(8)
  let { data, error } = await reviewQuery('id, reviewer_name, reviewer_institution, rating, comment, product:products(title)')
  if (error) ({ data } = await reviewQuery('id, reviewer_name, rating, comment, product:products(title)'))
  return data || []
}
