import {
  demoNavItems,
  demoSettings,
  demoFooterConfig,
  demoProducts,
  demoCategories,
} from '@/lib/demo-data'
import { getAppearance, settingsToMap, parseSocialLinks } from '@/lib/utils'

const DEMO_KEY = '_bgym_demo_products'

export const PUBLIC_PRODUCT_COLUMNS = [
  'id', 'title', 'slug', 'description', 'category_id', 'type', 'purchase_button_label',
  'sale_price', 'original_price', 'stock_type', 'stock_qty', 'badge', 'badge_custom',
  'is_featured', 'cover_path', 'preview_path', 'file_size', 'card_layout', 'sort_order',
  'is_active', 'published_at', 'meta_title', 'meta_description',
].join(', ')

export function stripPrivateProductFields({ file_url, file_path, file_name, mime_type, ...rest }) {
  return rest
}

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

export function loadDemoProducts() {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return null
}

export function saveDemoProducts(products) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(products))
  } catch {}
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
    contentBlocks: [],
    ...extra,
  }
}

export function demoShellDataWithProducts(products, extra = {}) {
  const settings = { ...demoSettings }
  return {
    navItems: demoNavItems,
    settings,
    appearance: getAppearance(settings),
    footerConfig: demoFooterConfig,
    announcement: getAnnouncement(settings),
    products,
    categories: demoCategories,
    contentBlocks: [],
    ...extra,
  }
}

export async function fetchStoreShell() {
  if (!hasSupabase()) {
    const saved = loadDemoProducts()
    return demoShellDataWithProducts(
      (saved || demoProducts).filter((p) => p.is_active)
    )
  }

  const { createClient } = await import('@/lib/supabase-server')

  let supabase
  try {
    supabase = await createClient()
  } catch {
    return demoShellData({ products: [], categories: [] })
  }

  const defaults = {
    navItems: demoNavItems,
    settings: demoSettings,
    appearance: getAppearance(demoSettings),
    footerConfig: demoFooterConfig,
    announcement: getAnnouncement(demoSettings),
    products: [],
    categories: [],
    contentBlocks: [],
  }

  async function safeQuery(fn) {
    try {
      const result = await fn()
      if (result?.error) {
        console.error('store-shell query error:', result.error)
        return null
      }
      return result
    } catch (e) {
      console.error('store-shell query error:', e)
      return null
    }
  }

  const [navItems, settingsRows, footerConfig, products, categories, contentBlocks] = await Promise.all([
    safeQuery(() =>
      supabase.from('navigation_items').select('*').eq('is_visible', true).order('sort_order')
    ),
    safeQuery(() =>
      supabase.from('settings').select('*')
    ),
    safeQuery(() =>
      supabase.from('footer_config').select('*')
    ),
    safeQuery(() =>
      supabase
        .from('products')
        .select(`${PUBLIC_PRODUCT_COLUMNS}, category:categories(*)`)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order')
    ),
    safeQuery(() =>
      supabase.from('categories').select('*').order('sort_order')
    ),
    safeQuery(() =>
      supabase.from('content_blocks').select('*').eq('is_active', true).order('sort_order')
    ),
  ])

  let productRows = products?.data || null
  if (!productRows) {
    const fallback = await safeQuery(() =>
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order')
    )
    productRows = (fallback?.data || null)?.map(stripPrivateProductFields) || null
  }

  if (!productRows && !navItems && !settingsRows) {
    return defaults
  }

  const settings = settingsToMap(settingsRows?.data || [])
  const appearance = getAppearance(settings)

  return {
    navItems: navItems?.data || defaults.navItems,
    settings,
    appearance,
    footerConfig: footerConfig?.data || defaults.footerConfig,
    announcement: getAnnouncement(settings),
    products: productRows || defaults.products,
    categories: categories?.data || defaults.categories,
    contentBlocks: contentBlocks?.data || defaults.contentBlocks,
  }
}
