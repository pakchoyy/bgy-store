import { clsx } from "clsx";

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function calcDiscount(originalPrice, salePrice) {
  if (!originalPrice || originalPrice <= salePrice) {
    return { showDiscount: false, percent: 0, saving: 0 }
  }
  const saving = originalPrice - salePrice
  const percent = Math.round((saving / originalPrice) * 100)
  return { showDiscount: true, percent, saving }
}

export function getStorageUrl(bucket, path) {
  if (!path) return null
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

export function buildPageTitle(template, variables) {
  let title = template
  for (const [key, value] of Object.entries(variables)) {
    title = title.replace(`{${key}}`, value)
  }
  return title
}

export const CARD_LAYOUTS = [
  { value: 'landscape', label: 'Kotak Panjang', aspect: 'aspect-[16/10]', grid: 'col-span-2' },
  { value: 'square', label: 'Persegi', aspect: 'aspect-square', grid: 'col-span-1' },
  { value: 'portrait', label: 'Tegak', aspect: 'aspect-[3/4]', grid: 'col-span-1' },
  { value: 'wide', label: 'Melebar', aspect: 'aspect-[21/9]', grid: 'col-span-2' },
  { value: 'compact', label: 'Kompak', aspect: null, grid: 'col-span-2' },
]

export function getCardLayout(layout) {
  return CARD_LAYOUTS.find((l) => l.value === layout) || CARD_LAYOUTS[0]
}

export function parseSocialLinks(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function settingsToMap(rows) {
  const map = {}
  ;(rows || []).forEach((row) => {
    map[row.key] = row.value
  })
  return map
}

export function getAppearance(settings = {}) {
  return {
    profileName: settings.profile_name || settings.site_name || 'Bantu Guru Yuk',
    profileHandle: settings.profile_handle || '@bgy',
    profileAbout: settings.profile_about || settings.site_tagline || '',
    profileAvatarUrl: settings.profile_avatar_url || '',
    bannerUrl: settings.banner_url || '',
    bannerEnabled: settings.banner_enabled !== 'false',
    bgColor: settings.bg_color || settings.theme_primary_color || '#0ea5a0',
    bgStyle: settings.bg_style || 'gradient',
    bgImageUrl: settings.bg_image_url || '',
    themeFont: settings.theme_font || 'system',
    themePrimaryColor: settings.theme_primary_color || '#0ea5a0',
    themeSecondaryColor: settings.theme_secondary_color || '#0d7a8a',
    themeBorderRadius: settings.theme_border_radius || 'rounded',
    themeButtonStyle: settings.theme_button_style || 'solid',
    socialLinks: parseSocialLinks(settings.social_links),
    siteName: settings.site_name || 'Bantu Guru Yuk',
  }
}

export function safeUrl(value, fallback = null) {
  if (typeof value !== 'string') return fallback
  const url = value.trim()
  if (!url) return fallback
  if (url.startsWith('/') && !url.startsWith('//')) return url
  try {
    const parsed = new URL(url)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.toString() : fallback
  } catch {
    return fallback
  }
}

export function resolveNavHref(item) {
  if (!item) return '/'
  if (item.target_type === 'external') return safeUrl(item.target_url, '/')
  if (item.target_type === 'product') return `/produk/${item.target_id || item.target_url || ''}`
  if (item.target_type === 'category') return `/kategori/${item.target_id || item.target_url || ''}`
  if (item.target_type === 'page') return `/halaman/${item.target_id || item.target_url || ''}`
  return safeUrl(item.target_url, '/')
}

export function whatsappUrl(socialLinks) {
  const wa = parseSocialLinks(socialLinks || []).find((l) => l.platform === 'whatsapp')
  if (!wa?.url) return null
  return wa.url.startsWith('http') ? wa.url : `https://wa.me/${wa.url.replace(/\D/g, '')}`
}

export function parsePreviewImages(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string' && v)
  const text = String(value).trim()
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text)
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string' && v) : []
    } catch {
      return []
    }
  }
  return [text]
}
