import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoCategories, demoProducts } from '@/lib/demo-data'
import KategoriManager from '@/components/admin/KategoriManager'

async function getData() {
  try {
    const supabase = await createClient()
    const { data: categories } = await supabase.from('categories').select('*').order('sort_order')
    const { data: products } = await supabase.from('products').select('category_id')
    if (categories) {
      const counts = {}
      if (products) {
        products.forEach(p => {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1
        })
      }
      const withCounts = categories.map(c => ({ ...c, product_count: counts[c.id] || 0 }))
      return withCounts
    }
  } catch {}

  const counts = {}
  demoProducts.forEach(p => {
    counts[p.category_id] = (counts[p.category_id] || 0) + 1
  })
  const withCounts = demoCategories.map(c => ({ ...c, product_count: counts[c.id] || 0 }))
  return withCounts
}

export default async function AdminKategori() {
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
  if (!isDemo) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')
  }

  const categories = await getData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Kelola Kategori</h1>
          <p className="text-sm text-gray-500 mt-0.5">Atur kategori produk</p>
        </div>
      </div>
      <KategoriManager categories={categories} />
    </div>
  )
}
