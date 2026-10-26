import { fetchAll } from '@/lib/fetch-all'
import {
  demoNavItems,
  demoSettings,
  demoFooterConfig,
  demoProducts,
  demoCategories,
} from '@/lib/demo-data'
import { getAppearance, settingsToMap, parseSocialLinks, withEffectivePrice } from '@/lib/utils'

const DEMO_KEY = '_bgym_demo_products'

export const PUBLIC_PRODUCT_COLUMNS = [
  'id', 'title', 'slug', 'description', 'category_id', 'type', 'purchase_button_label',
  'sale_price', 'original_price', 'stock_type', 'stock_qty', 'badge', 'badge_custom',
  'is_featured', 'cover_path', 'preview_path', 'file_size', 'card_layout', 'sort_order',
  'is_active', 'published_at', 'meta_title', 'meta_description', 'download_count',
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

  // Data toko sama untuk semua pengunjung: ambil tanpa cookie lalu simpan di cache server
  // 30 detik, supaya halaman tidak menembak Supabase di setiap kunjungan.
  const { unstable_cache } = await import('next/cache')
  const cached = unstable_cache(fetchStoreShellFresh, ['store-shell-v1'], { revalidate: 30, tags: ['store'] })
  return cached()
}

async function fetchStoreShellFresh() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

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
        .select(`${PUBLIC_PRODUCT_COLUMNS}, flash_price, flash_ends_at, semester, price_options, allow_custom_price, min_price, event_at, category:categories(*)`)
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
  const soldCounts = productRows ? await fetchSoldCounts(supabase, safeQuery) : {}
  if (productRows) {
    // show_on_home (SQL 020) diambil terpisah supaya toko tetap jalan walau SQL belum dijalankan.
    const homeFlags = await safeQuery(() => supabase.from('products').select('id, show_on_home').eq('show_on_home', false))
    const hidden = new Set((homeFlags?.data || []).map((p) => p.id))
    productRows = productRows.map((p) => ({ ...p, show_on_home: !hidden.has(p.id) }))
  }
  if (!productRows) {
    // Kolom SQL 026 (nominal pilihan / waktu acara) belum bisa dibaca: tetap tampilkan produk tanpa kolom itu.
    const withoutEvent = await safeQuery(() =>
      supabase
        .from('products')
        .select(`${PUBLIC_PRODUCT_COLUMNS}, flash_price, flash_ends_at, semester, category:categories(*)`)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order')
    )
    productRows = withoutEvent?.data || null
  }
  if (!productRows) {
    const withoutSemester = await safeQuery(() =>
      supabase
        .from('products')
        .select(`${PUBLIC_PRODUCT_COLUMNS}, flash_price, flash_ends_at, category:categories(*)`)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order')
    )
    productRows = withoutSemester?.data || null
  }
  if (!productRows) {
    const withoutFlash = await safeQuery(() =>
      supabase
        .from('products')
        .select(`${PUBLIC_PRODUCT_COLUMNS}, category:categories(*)`)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order')
    )
    productRows = withoutFlash?.data || null
  }
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
    products: (productRows || defaults.products)
      .map((p) => ({ ...p, sold_count: soldCounts[p.id] || 0 }))
      .filter((p) => !(p.semester && settings[`hide_semester_${p.semester}`] === 'true'))
      .map((p) => withEffectivePrice(p)),
    categories: categories?.data || defaults.categories,
    contentBlocks: contentBlocks?.data || defaults.contentBlocks,
  }
}

// Jumlah terjual per produk: pesanan lunas (satuan + keranjang) ditambah sold_manual.
// Hanya angka yang dikirim ke halaman publik; data pesanan tidak pernah keluar.
async function fetchSoldCounts(anon, safeQuery) {
  const counts = {}
  const add = (id, n = 1) => { if (id) counts[id] = (counts[id] || 0) + n }
  try {
    const { hasServiceRole, createServiceClient } = await import('@/lib/supabase-server')
    if (!hasServiceRole()) return counts
    const db = await createServiceClient()
    // sold_manual tidak bisa dibaca anon (hak kolom), jadi dibaca lewat service role.
    const manual = await db.from('products').select('id, sold_manual').gt('sold_manual', 0)
    for (const row of manual?.data || []) add(row.id, Number(row.sold_manual) || 0)
    // Supabase mengembalikan maksimal 1000 baris per permintaan, jadi ambil per halaman.
    const all = async (query) => {
      const { data, error } = await fetchAll(query)
      if (error) throw error
      return data
    }
    const [items, singles] = await Promise.all([
      all(() => db.from('order_items').select('order_id, product_id, orders!inner(status)').eq('orders.status', 'paid').order('id')),
      all(() => db.from('orders').select('id, product_id').eq('status', 'paid').not('product_id', 'is', null).order('id')),
    ])
    const withItems = new Set()
    for (const it of items) { withItems.add(it.order_id); add(it.product_id) }
    for (const o of singles) if (!withItems.has(o.id)) add(o.product_id)
  } catch (e) {
    console.error('sold counts error:', e?.message)
  }
  return counts
}
