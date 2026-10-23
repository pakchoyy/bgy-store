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
    const raw = voucher.discount_type === 'fixed' ? Number(voucher.discount_value) : Math.floor(subtotal * Number(voucher.discount_value) / 100)
    discount = Math.max(0, Math.min(subtotal, raw || 0))
  }
  const total = subtotal - discount
  if (total > 0 && total < MIN_ONLINE_PAYMENT) return { error: 'Total pembayaran online minimal Rp1.000. Voucher ini membuat total terlalu kecil.' }
  return { subtotal, discount, total }
}
