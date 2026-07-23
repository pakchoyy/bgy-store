import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoSections, demoProducts, demoCategories } from '@/lib/demo-data'
import HomepageBuilder from '@/components/admin/HomepageBuilder'

export const dynamic = 'force-dynamic'

export default async function AdminHomepage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url'

  let sections = []
  let products = []
  let categories = []

  if (hasSupabase) {
    const [secRes, prodRes, catRes] = await Promise.all([
      supabase.from('homepage_sections').select('*').order('sort_order', { ascending: true }),
      supabase
        .from('products')
        .select('id, title, type, sale_price, is_featured, is_active')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order')
        .limit(12),
      supabase.from('categories').select('id, name, color, slug').order('sort_order').limit(10),
    ])
    sections = secRes.data || []
    products = prodRes.data || []
    categories = catRes.data || []
  }

  if (!sections.length) sections = demoSections
  if (!products.length) products = demoProducts
  if (!categories.length) categories = demoCategories

  return (
    <HomepageBuilder
      initialSections={sections}
      products={products}
      categories={categories}
      siteName="BGY"
    />
  )
}
