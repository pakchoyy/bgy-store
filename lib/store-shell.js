import {
  demoNavItems,
  demoSettings,
  demoFooterConfig,
  demoProducts,
  demoCategories,
} from '@/lib/demo-data'
import { getAppearance, settingsToMap } from '@/lib/utils'

export function hasSupabase() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url'
  )
}

export function getAnnouncement(settings) {
  if (settings.announcement_active !== 'true') return null
  const now = new Date()
  const start = settings.announcement_start ? new Date(settings.announcement_start) : null
  const end = settings.announcement_end ? new Date(settings.announcement_end) : null
  if (start && start > now) return null
  if (end && end < now) return null
  return {
    text: settings.announcement_text,
    url: settings.announcement_url,
    bgColor: settings.announcement_bg_color,
    textColor: settings.announcement_text_color,
  }
}

export function demoShellData(extra = {}) {
  const settings = { ...demoSettings }
  return {
    navItems: demoNavItems,
    settings,
    appearance: getAppearance(settings),
    footerConfig: demoFooterConfig,
    announcement: getAnnouncement(settings),
    products: demoProducts.filter((p) => p.is_active),
    categories: demoCategories,
    ...extra,
  }
}

export async function fetchStoreShell() {
  if (!hasSupabase()) return demoShellData()

  const { createClient } = await import('@/lib/supabase-server')
  const supabase = await createClient()

  const [
    { data: navItems },
    { data: settingsRows },
    { data: footerConfig },
    { data: products },
    { data: categories },
  ] = await Promise.all([
    supabase.from('navigation_items').select('*').eq('is_visible', true).order('sort_order'),
    supabase.from('settings').select('*'),
    supabase.from('footer_config').select('*'),
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order'),
    supabase.from('categories').select('*').order('sort_order'),
  ])

  const settings = settingsToMap(settingsRows || [])
  return {
    navItems: navItems || [],
    settings,
    appearance: getAppearance(settings),
    footerConfig: footerConfig || [],
    announcement: getAnnouncement(settings),
    products: products || [],
    categories: categories || [],
  }
}
