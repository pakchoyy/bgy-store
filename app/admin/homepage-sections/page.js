import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoSettings, demoSections, demoProducts, demoCategories } from '@/lib/demo-data'
import HomepageBuilder from '@/components/admin/HomepageBuilder'

export const dynamic = 'force-dynamic'

export default async function AdminHomepageSections() {
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
  let supabase
  if (!isDemo) {
    supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')
  }

  let sections = demoSections
  let products = demoProducts
  let categories = demoCategories
  let siteName = demoSettings.site_name || 'BGY'

  if (!isDemo) {
    const [sectionsRes, productsRes, categoriesRes, settingsRes] = await Promise.all([
      supabase.from('homepage_sections').select('*').order('sort_order'),
      supabase
        .from('products')
        .select('id, title, type, is_featured, is_active, sort_order')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('settings').select('*').eq('key', 'site_name').maybeSingle(),
    ])
    if (sectionsRes.data?.length) sections = sectionsRes.data
    if (productsRes.data?.length) products = productsRes.data
    if (categoriesRes.data?.length) categories = categoriesRes.data
    if (settingsRes.data?.value) siteName = settingsRes.data.value
  }

  return (
    <HomepageBuilder
      initialSections={sections}
      products={products}
      categories={categories}
      siteName={siteName}
    />
  )
}
