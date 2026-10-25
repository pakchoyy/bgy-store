import { rateLimited, tooMany } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { createTrustedServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  if (rateLimited(request, 'voucher', 20, 10 * 60 * 1000)) return tooMany()
  try {
    const { searchParams } = new URL(request.url)
    const code = String(searchParams.get('code') || '').trim().toUpperCase().slice(0, 64)
    const amount = Math.max(0, Math.floor(Number(searchParams.get('amount')) || 0))
    if (!code) return NextResponse.json({ error: 'Masukkan kode voucher.' }, { status: 400 })

    const supabase = await createTrustedServerClient()
    const { data: voucher, error } = await supabase.from('vouchers').select('code, discount_type, discount_value, min_order_amount, starts_at, ends_at, max_uses, used_count').eq('code', code).eq('is_active', true).maybeSingle()
    if (error || !voucher) return NextResponse.json({ error: 'Voucher tidak ditemukan atau sudah tidak aktif.' }, { status: 404 })
    // Aturan voucher sama persis dengan checkout (lib/pricing.mjs)
    const { computeTotal } = await import('@/lib/pricing.mjs')
    const result = computeTotal([{ type: 'paid', sale_price: amount }], voucher)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    const { discount, total } = result
    return NextResponse.json({ discount, code, message: total === 0 ? `Voucher ${code} berhasil dipakai. Produk ini jadi gratis!` : `Voucher ${code} berhasil dipakai. Hemat Rp ${discount.toLocaleString('id-ID')}.` })
  } catch (error) {
    console.error('voucher validation error:', error)
    return NextResponse.json({ error: 'Voucher belum dapat diperiksa.' }, { status: 500 })
  }
}
