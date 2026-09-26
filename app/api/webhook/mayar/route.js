import { NextResponse } from 'next/server'

function normalizeWebhookPayload(parsed) {
  const data = parsed?.data || parsed?.payload || parsed || {}
  const metadata = data.metadata || parsed?.metadata || {}
  const rawStatus = data.status
    || data.payment_status
    || data.transaction_status
    || data.invoice_status
    || parsed?.event
    || parsed?.type
    || ''
  const status = String(rawStatus).toLowerCase()
  const isNegative = /unpaid|not[_\s-]?paid|unsuccess|incomplete|pending|fail|expire|cancel|void/.test(status)
  const localOrderId = metadata.order_id
    || metadata.orderId
    || data.referenceId
    || data.reference_id
    || data.order_id
    || data.orderId
    || parsed?.order_id
    || null
  const mayarId = data.invoiceId
    || data.invoice_id
    || data.transactionId
    || data.transaction_id
    || data.paymentId
    || data.payment_id
    || data.id
    || data.uuid
    || parsed?.invoice_id
    || parsed?.payment_id
    || null
  const paymentId = data.paymentId
    || data.payment_id
    || data.transactionId
    || data.transaction_id
    || mayarId

  return {
    data,
    localOrderId,
    mayarId,
    paymentId,
    isPaid: !isNegative && ['paid', 'settled', 'success', 'succeeded', 'completed'].some((item) => status.includes(item)),
    isFailed: ['failed', 'expired', 'cancel', 'void'].some((item) => status.includes(item)),
  }
}

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
