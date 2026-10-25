import { rateLimitedShared, tooMany } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { SITE_URL, SITE_HOST } from '@/lib/site'

export async function POST(request) {
  if (await rateLimitedShared(request, 'traktir', 10, 10 * 60 * 1000)) return tooMany()
  try {
    const body = await request.json()
    const cleanAmount = Math.floor(Number(body.amount) || 0)
    const buyerName = String(body.buyer_name || '').trim().slice(0, 120) || 'Pendukung Kreacy'
    const buyerEmail = String(body.buyer_email || '').trim().slice(0, 254) || process.env.TRAKTIR_DEFAULT_EMAIL || `traktir@${SITE_HOST}`
    const fileId = /^[0-9a-f-]{36}$/i.test(String(body.product_id || '')) ? String(body.product_id) : ''
    const cleanWhatsapp = String(body.buyer_whatsapp || '').replace(/[^\d+]/g, '') || process.env.TRAKTIR_DEFAULT_PHONE || '081200000000'

    if (cleanAmount < 1000) return NextResponse.json({ error: 'Nominal minimal Rp1.000' }, { status: 400 })
    if (cleanAmount > 10000000) return NextResponse.json({ error: 'Nominal terlalu besar' }, { status: 400 })

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url'

    if (!hasSupabase) {
      return NextResponse.json({ error: 'Database belum dikonfigurasi' }, { status: 500 })
    }

    const { hasMayarApiKey, createPaymentLink, extractMayarInvoice } = await import('@/lib/mayar')

    if (!hasMayarApiKey()) {
      return NextResponse.json({ error: 'Mayar API key belum dikonfigurasi' }, { status: 500 })
    }

    const { createServiceClient } = await import('@/lib/supabase-server')
    const supabase = await createServiceClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id: null,
        buyer_name: buyerName,
        buyer_whatsapp: cleanWhatsapp,
        buyer_email: buyerEmail,
        amount: cleanAmount,
        status: 'pending',
        payment_method: 'mayar',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('traktir order insert error:', orderError)
      return NextResponse.json({ error: 'Gagal membuat donasi' }, { status: 500 })
    }

    const siteUrl = SITE_URL

    try {
      const redirectUrl = `${siteUrl}/terima-kasih?order=${order.id}${fileId ? `&file=${fileId}` : ''}`
      const mayarResponse = await createPaymentLink({
        amount: cleanAmount,
        name: 'Traktir Kopi',
        description: 'Traktir Kopi untuk Pak Choy - Kreacy',
        redirectUrl,
        customer: { name: buyerName, email: buyerEmail, phone: cleanWhatsapp },
      })
      const { paymentUrl, invoiceId, transactionId } = extractMayarInvoice(mayarResponse)

      if (!paymentUrl) {
        throw new Error('Tautan pembayaran Mayar tidak tersedia')
      }

      await supabase
        .from('orders')
        .update({
          mayar_order_id: invoiceId || null,
          mayar_payment_id: transactionId || invoiceId || null,
          payment_id: transactionId || invoiceId || null,
          payment_url: paymentUrl,
        })
        .eq('id', order.id)

      return NextResponse.json({ payment_url: paymentUrl, order_id: order.id })
    } catch (e) {
      console.error('traktir mayar error:', e)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id)
      console.error('[mayar] create payment failed:', e); return NextResponse.json({ error: 'Pembayaran belum bisa dibuat. Coba lagi sebentar lagi.' }, { status: 502 })
    }
  } catch (err) {
    console.error('traktir error:', err)
    console.error('[traktir] error:', err); return NextResponse.json({ error: 'Terjadi kesalahan. Coba lagi.' }, { status: 500 })
  }
}
