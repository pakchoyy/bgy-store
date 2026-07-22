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
