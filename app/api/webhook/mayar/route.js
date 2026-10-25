import { NextResponse } from 'next/server'
import { rateLimited, tooMany } from '@/lib/rate-limit'
import { normalizeWebhookPayload } from '@/lib/mayar-webhook.mjs'

export async function POST(request) {
  try {
    const payload = await request.text()
    let parsed

    try {
      parsed = JSON.parse(payload)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const signature = request.headers.get('X-Mayar-Signature')
      || request.headers.get('x-mayar-signature')
      || request.headers.get('X-Webhook-Signature')
      || ''
    const { verifyWebhookSignature } = await import('@/lib/mayar')

    // Unsigned or unverifiable webhooks are not trusted: the order is re-checked against the Mayar API instead.
    const trusted = verifyWebhookSignature(payload, signature)

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url'

    if (!hasSupabase) {
      return NextResponse.json({ error: 'Database belum dikonfigurasi' }, { status: 500 })
    }

    const { createServiceClient } = await import('@/lib/supabase-server')
    const supabase = await createServiceClient()

    if (!supabase) {
      throw new Error('Supabase service key belum dikonfigurasi')
    }

    const normalized = normalizeWebhookPayload(parsed)
    const { findOrderForWebhook, markOrderPaid, syncOrderWithMayar } = await import('@/lib/orders')
    const order = await findOrderForWebhook(supabase, normalized)

    if (!order) {
      console.error('[Mayar Webhook] Order not found:', normalized)
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    if (!trusted) {
      // Tanpa tanda tangan: cek ulang ke Mayar, dibatasi supaya tidak bisa dipakai menghabiskan kuota API.
      if (rateLimited(request, 'webhook-unsigned', 30, 60 * 1000)) return tooMany()
      await syncOrderWithMayar(supabase, order)
    } else if (normalized.isPaid) {
      await markOrderPaid(supabase, order, { mayarId: normalized.mayarId, paymentId: normalized.paymentId })
    } else if (normalized.isFailed && order.status === 'pending') {
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', order.id)
        .eq('status', 'pending')
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('[Mayar Webhook Error]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
