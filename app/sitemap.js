import { fetchStoreShell, hasSupabase } from '@/lib/store-shell'
import { demoProducts, demoCategories } from '@/lib/demo-data'

export const dynamic = 'force-dynamic'

export default async function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bgy-store.vercel.app').replace(/\/$/, '')
  const { products = [], categories = [] } = hasSupabase()
    ? await fetchStoreShell()
    : { products: demoProducts.filter((p) => p.is_active), categories: demoCategories }

  const staticPages = ['', '/produk', '/free', '/halaman/tentang-kami', '/halaman/faq'].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))

  return [
    ...staticPages,
    ...categories.map((c) => ({ url: `${base}/kategori/${c.slug}`, changeFrequency: 'weekly', priority: 0.6 })),
    ...products
      .filter((p) => p.slug)
      .map((p) => ({ url: `${base}/produk/${p.slug}`, lastModified: p.published_at || undefined, changeFrequency: 'weekly', priority: 0.8 })),
  ]
}
