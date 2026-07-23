import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import {
  demoSettings,
  demoNavItems,
  demoProducts,
} from '@/lib/demo-data'
import { getAppearance, settingsToMap } from '@/lib/utils'
import AppearanceBuilder from '@/components/admin/AppearanceBuilder'

export const dynamic = 'force-dynamic'

export default async function AdminAppearance() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url'

  let settings = { ...demoSettings }
  let navItems = demoNavItems
  let products = demoProducts

  if (hasSupabase) {
    const [setRes, navRes, prodRes] = await Promise.all([
      supabase.from('settings').select('*'),
      supabase.from('navigation_items').select('*').order('sort_order'),
      supabase
        .from('products')
        .select('id, title, type, sale_price, is_active, sort_order, card_layout')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order')
        .limit(12),
    ])
    if (setRes.data?.length) settings = { ...settings, ...settingsToMap(setRes.data) }
    if (navRes.data?.length) navItems = navRes.data
    if (prodRes.data?.length) products = prodRes.data
  }

  return (
    <AppearanceBuilder
      initialAppearance={getAppearance(settings)}
      navItems={navItems}
      products={products}
      siteName={settings.site_name || 'BGY'}
    />
  )
}
