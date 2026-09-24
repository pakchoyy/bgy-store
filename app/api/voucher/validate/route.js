import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = String(searchParams.get('code') || '').trim().toUpperCase()
    const amount = Number(searchParams.get('amount') || 0)
    if (!code) return NextResponse.json({ error: 'Masukkan kode voucher.' }, { status: 400 })

    const supabase = await createClient()
    const { data: voucher, error } = await supabase.from('vouchers').select('*').eq('code', code).eq('is_active', true).maybeSingle()
    if (error || !voucher) return NextResponse.json({ error: 'Voucher tidak ditemukan atau sudah tidak aktif.' }, { status: 404 })
    if (voucher.starts_at && new Date(voucher.starts_at) > new Date()) return NextResponse.json({ error: 'Voucher belum mulai berlaku.' }, { status: 400 })
    if (voucher.ends_at && new Date(voucher.ends_at) < new Date()) return NextResponse.json({ error: 'Voucher sudah kedaluwarsa.' }, { status: 400 })
    if (voucher.max_uses && voucher.used_count >= voucher.max_uses) return NextResponse.json({ error: 'Batas penggunaan voucher sudah tercapai.' }, { status: 400 })
    if (amount < Number(voucher.min_order_amount || 0)) return NextResponse.json({ error: `Minimal belanja ${Number(voucher.min_order_amount).toLocaleString('id-ID')}.` }, { status: 400 })

    const rawDiscount = voucher.discount_type === 'fixed' ? Number(voucher.discount_value) : Math.floor(amount * Number(voucher.discount_value) / 100)
    const discount = Math.min(Math.max(0, rawDiscount), amount)
    return NextResponse.json({ discount, code, message: `Voucher ${code} berhasil dipakai. Hemat Rp ${discount.toLocaleString('id-ID')}.` })
  } catch (error) {
    console.error('voucher validation error:', error)
    return NextResponse.json({ error: 'Voucher belum dapat diperiksa.' }, { status: 500 })
  }
}
