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

    const ids = String(searchParams.get('product_ids') || '').split(',').filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 20)

    const supabase = await createTrustedServerClient()
    const cols = 'code, discount_type, discount_value, min_order_amount, starts_at, ends_at, max_uses, used_count'
    const voucherQuery = (c) => supabase.from('vouchers').select(c).eq('code', code).eq('is_active', true).maybeSingle()
    // Kolom product_ids mungkin belum ada (SQL belum dijalankan): ulangi tanpa kolom itu.
    let { data: voucher, error } = await voucherQuery(`${cols}, product_ids`)
    if (error) ({ data: voucher, error } = await voucherQuery(cols))
    if (error || !voucher) return NextResponse.json({ error: 'Voucher tidak ditemukan atau sudah tidak aktif.' }, { status: 404 })
    // Aturan voucher sama persis dengan checkout (lib/pricing.mjs)
    const { computeTotal } = await import('@/lib/pricing.mjs')
    let items = [{ type: 'paid', sale_price: amount }]
    if (ids.length) {
      let { data: found, error: foundError } = await supabase.from('products').select('id, type, sale_price, flash_price, flash_ends_at, price_options, allow_custom_price, min_price').in('id', ids)
      if (foundError) ({ data: found } = await supabase.from('products').select('id, type, sale_price').in('id', ids))
      // Produk nominal pilihan: pakai nominal yang dipilih pembeli (amount).
      const { isFlexiblePrice } = await import('@/lib/pricing.mjs')
      if (found?.length) items = found.map((p) => (isFlexiblePrice(p) ? { ...p, sale_price: amount, flash_price: null } : p))
    }
    const result = computeTotal(items, voucher)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    const { discount, total } = result
    return NextResponse.json({ discount, code, message: total === 0 ? `Voucher ${code} berhasil dipakai. Produk ini jadi gratis!` : `Voucher ${code} berhasil dipakai. Hemat Rp ${discount.toLocaleString('id-ID')}.` })
  } catch (error) {
    console.error('voucher validation error:', error)
    return NextResponse.json({ error: 'Voucher belum dapat diperiksa.' }, { status: 500 })
  }
}
