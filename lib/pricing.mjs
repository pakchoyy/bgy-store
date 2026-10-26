// Hitungan harga murni (tanpa database) supaya bisa dites: flash sale, voucher, batas minimal Mayar.

export const MIN_ONLINE_PAYMENT = 1000

export function effectivePrice(product, now = Date.now()) {
  const normal = Number(product?.sale_price || 0)
  const flash = product?.flash_price === null || product?.flash_price === undefined || product?.flash_price === '' ? null : Number(product.flash_price)
  const endsAt = product?.flash_ends_at ? new Date(product.flash_ends_at).getTime() : 0
  const flashActive = product?.type === 'paid' && flash !== null && flash >= 0 && flash < normal && endsAt > now
  return { price: flashActive ? flash : normal, normal, flashActive, endsAt: flashActive ? product.flash_ends_at : null }
}

// Kembalikan { error } atau { subtotal, discount, total }.
export function computeTotal(items, voucher = null, now = Date.now()) {
  const subtotal = items.reduce((sum, p) => sum + effectivePrice(p, now).price, 0)
  let discount = 0
  if (voucher) {
    if ((voucher.starts_at && new Date(voucher.starts_at).getTime() > now)
      || (voucher.ends_at && new Date(voucher.ends_at).getTime() < now)
      || (voucher.max_uses && voucher.used_count >= voucher.max_uses)) return { error: 'Voucher sudah tidak berlaku' }
    if (subtotal < Number(voucher.min_order_amount || 0)) return { error: 'Minimal belanja untuk voucher belum terpenuhi' }
    // product_ids kosong/null = berlaku untuk semua produk; kalau diisi, potongan hanya dari produk itu.
    const only = Array.isArray(voucher.product_ids) && voucher.product_ids.length ? voucher.product_ids : null
    const base = only ? items.filter((p) => only.includes(p.id)).reduce((sum, p) => sum + effectivePrice(p, now).price, 0) : subtotal
    if (only && !base) return { error: 'Voucher ini tidak berlaku untuk produk yang dipilih.' }
    const raw = voucher.discount_type === 'fixed' ? Number(voucher.discount_value) : Math.floor(base * Number(voucher.discount_value) / 100)
    discount = Math.max(0, Math.min(base, raw || 0))
  }
  const total = subtotal - discount
  if (total > 0 && total < MIN_ONLINE_PAYMENT) return { error: 'Total pembayaran online minimal Rp1.000. Voucher ini membuat total terlalu kecil.' }
  return { subtotal, discount, total }
}

// Nominal pilihan pembeli (mis. webinar: 20rb / 40rb / 50rb, atau isi sendiri dengan batas minimal).
export function isFlexiblePrice(product) {
  return product?.type === 'paid' && ((Array.isArray(product.price_options) && product.price_options.length > 0) || !!product.allow_custom_price)
}

export function priceChoices(product) {
  const list = Array.isArray(product?.price_options) ? product.price_options : []
  return [...new Set(list.map((n) => Math.round(Number(n))).filter((n) => Number.isFinite(n) && n >= MIN_ONLINE_PAYMENT))].sort((a, b) => a - b)
}

export function customMinimum(product) {
  return Math.max(MIN_ONLINE_PAYMENT, Math.round(Number(product?.min_price) || 0))
}

// Harga terendah yang bisa dibayar (untuk label "Mulai Rp...").
export function lowestPrice(product) {
  if (!isFlexiblePrice(product)) return effectivePrice(product).price
  const options = priceChoices(product)
  const candidates = [...options, ...(product.allow_custom_price ? [customMinimum(product)] : [])]
  return candidates.length ? Math.min(...candidates) : customMinimum(product)
}

// Kembalikan { price } atau { error }. Produk biasa: harga dari toko (amount diabaikan).
export function resolveChosenPrice(product, amount) {
  if (!isFlexiblePrice(product)) return { price: effectivePrice(product).price }
  const n = Math.round(Number(amount))
  if (!Number.isFinite(n) || n <= 0) return { error: 'Pilih nominal dulu.' }
  if (priceChoices(product).includes(n)) return { price: n }
  if (!product.allow_custom_price) return { error: 'Pilih salah satu nominal yang tersedia.' }
  const min = customMinimum(product)
  if (n < min) return { error: `Nominal minimal Rp${min.toLocaleString('id-ID')}.` }
  if (n > 100000000) return { error: 'Nominal terlalu besar.' }
  return { price: n }
}
