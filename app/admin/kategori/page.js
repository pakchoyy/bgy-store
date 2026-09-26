import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import KategoriManager from '@/components/admin/KategoriManager'
import AdminTabs, { STRUCTURE_TABS } from '@/components/admin/AdminTabs'

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
  return []
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
    <div>
      <AdminTabs tabs={STRUCTURE_TABS} active="kategori" />
      <KategoriManager categories={categories} />
    </div>
  )
}
