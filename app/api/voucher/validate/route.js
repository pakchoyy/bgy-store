import { NextResponse } from 'next/server'
import { createTrustedServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = String(searchParams.get('code') || '').trim().toUpperCase().slice(0, 64)
    const amount = Number(searchParams.get('amount') || 0)
    if (!code) return NextResponse.json({ error: 'Masukkan kode voucher.' }, { status: 400 })

    const supabase = await createTrustedServerClient()
    const { data: voucher, error } = await supabase.from('vouchers').select('code, discount_type, discount_value, min_order_amount, starts_at, ends_at, max_uses, used_count').eq('code', code).eq('is_active', true).maybeSingle()
    if (error || !voucher) return NextResponse.json({ error: 'Voucher tidak ditemukan atau sudah tidak aktif.' }, { status: 404 })
    if (voucher.starts_at && new Date(voucher.starts_at) > new Date()) return NextResponse.json({ error: 'Voucher belum mulai berlaku.' }, { status: 400 })
    if (voucher.ends_at && new Date(voucher.ends_at) < new Date()) return NextResponse.json({ error: 'Voucher sudah kedaluwarsa.' }, { status: 400 })
    if (voucher.max_uses && voucher.used_count >= voucher.max_uses) return NextResponse.json({ error: 'Batas penggunaan voucher sudah tercapai.' }, { status: 400 })
    if (amount < Number(voucher.min_order_amount || 0)) return NextResponse.json({ error: `Minimal belanja ${Number(voucher.min_order_amount).toLocaleString('id-ID')}.` }, { status: 400 })

    const rawDiscount = voucher.discount_type === 'fixed' ? Number(voucher.discount_value) : Math.floor(amount * Number(voucher.discount_value) / 100)
    const discount = Math.min(Math.max(0, rawDiscount), amount)
    const total = amount - discount
    if (total > 0 && total < 1000) {
      return NextResponse.json({ error: `Voucher ${code} membuat total jadi Rp ${total.toLocaleString('id-ID')}, di bawah minimal pembayaran Rp1.000.` }, { status: 400 })
    }
    return NextResponse.json({ discount, code, message: total === 0 ? `Voucher ${code} berhasil dipakai. Produk ini jadi gratis!` : `Voucher ${code} berhasil dipakai. Hemat Rp ${discount.toLocaleString('id-ID')}.` })
  } catch (error) {
    console.error('voucher validation error:', error)
    return NextResponse.json({ error: 'Voucher belum dapat diperiksa.' }, { status: 500 })
  }
}
