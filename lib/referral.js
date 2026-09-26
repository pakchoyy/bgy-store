export function referralCodeFor(order) {
  const letters = String(order.buyer_name || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'GURU'
  const suffix = String(order.id || '').replace(/[^0-9a-f]/gi, '').slice(0, 4).toUpperCase()
  return `REF${letters}${suffix}`
}

export async function ensureReferralVoucher(supabase, order, percent) {
  const code = referralCodeFor(order)
  const { data: existing } = await supabase.from('vouchers').select('code, is_active').eq('code', code).maybeSingle()
  if (existing) return existing.is_active ? code : null
  const { error } = await supabase.from('vouchers').insert({
    name: `Referral: ${String(order.buyer_name || 'Pembeli').slice(0, 60)} <${String(order.buyer_email || '').toLowerCase().slice(0, 120)}>`,
    code,
    discount_type: 'percent',
    discount_value: percent,
    is_active: true,
  })
  return error ? null : code
}

export function isOwnReferral(voucher, email) {
  const owner = /<([^>]+)>\s*$/.exec(String(voucher?.name || ''))?.[1]
  return !!owner && owner === String(email || '').trim().toLowerCase()
}
