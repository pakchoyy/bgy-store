import { rateLimited, tooMany } from '@/lib/rate-limit'
import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createServiceClient, hasServiceRole } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const WEEK = 7 * 24 * 60 * 60 * 1000
const phoneKey = (value) => String(value || '').replace(/\D/g, '').replace(/^(62|0)/, '').slice(-9)

export async function POST(request) {
  if (rateLimited(request, 'orders-lookup', 8, 10 * 60 * 1000)) return tooMany()
  const body = await request.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  const phone = phoneKey(body.whatsapp)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Email tidak valid.' }, { status: 400 })
  }
  if (phone.length < 8) return NextResponse.json({ error: 'Nomor WhatsApp tidak valid.' }, { status: 400 })
  if (!hasServiceRole()) return NextResponse.json({ error: 'Fitur belum aktif. Hubungi admin.' }, { status: 503 })

  const supabase = await createServiceClient()
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, created_at, amount, buyer_email, buyer_whatsapp, product_id, download_token, token_expires_at, product:products(title)')
    .eq('status', 'paid')
    .not('product_id', 'is', null)
    .ilike('buyer_email', email)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) return NextResponse.json({ error: 'Pesanan belum bisa dicek. Coba lagi.' }, { status: 500 })

  const matches = (orders || []).filter((o) => phoneKey(o.buyer_whatsapp) === phone)
  const { getOrderItems } = await import('@/lib/orders')
  const results = []
  for (const order of matches) {
    let token = order.download_token
    if (!token || !order.token_expires_at || new Date(order.token_expires_at) < new Date()) {
      token = token || `${order.id}-${Date.now()}-${crypto.randomBytes(24).toString('base64url')}`
      await supabase
        .from('orders')
        .update({ download_token: token, token_expires_at: new Date(Date.now() + WEEK).toISOString() })
        .eq('id', order.id)
    }
    const items = await getOrderItems(supabase, order)
    results.push({
      id: order.id,
      date: order.created_at,
      amount: order.amount,
      title: items.length > 1 ? items.map((i) => i.title).join(', ') : order.product?.title || 'Produk',
      link: `/terima-kasih?token=${encodeURIComponent(token)}`,
    })
  }

  return NextResponse.json({ orders: results }, { headers: { 'Cache-Control': 'no-store' } })
}
