import { NextResponse } from 'next/server'
import crypto from 'crypto'

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
    isPaid: ['paid', 'settled', 'success', 'succeeded', 'completed'].some((item) => status.includes(item)),
    isFailed: ['failed', 'expired', 'cancel', 'void'].some((item) => status.includes(item)),
  }
}

async function findOrder(supabase, { localOrderId, mayarId }) {
  if (localOrderId) {
    const { data } = await supabase
      .from('orders')
      .select('*, product:products(*)')
      .eq('id', localOrderId)
      .maybeSingle()

    if (data) return data
  }

  if (!mayarId) return null

  const fields = ['mayar_order_id', 'mayar_payment_id', 'payment_id']
  for (const field of fields) {
    const { data } = await supabase
      .from('orders')
      .select('*, product:products(*)')
      .eq(field, mayarId)
      .maybeSingle()

    if (data) return data
  }

  return null
}

function makeDownloadToken(orderId) {
  return `${orderId}-${Date.now()}-${crypto.randomBytes(24).toString('base64url')}`
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

    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

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
    const order = await findOrder(supabase, normalized)

    if (!order) {
      console.error('[Mayar Webhook] Order not found:', normalized)
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    if (normalized.isPaid) {
      const downloadToken = order.download_token || makeDownloadToken(order.id)
      const expiresAt = order.token_expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          mayar_order_id: normalized.mayarId || order.mayar_order_id,
          mayar_payment_id: normalized.paymentId || order.mayar_payment_id,
          payment_id: normalized.paymentId || order.payment_id,
          paid_at: order.paid_at || new Date().toISOString(),
          download_token: downloadToken,
          token_expires_at: expiresAt,
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('[Mayar Webhook] Failed to update order:', updateError)
        return NextResponse.json({ error: 'Gagal memperbarui pesanan' }, { status: 500 })
      }

      if (order.status !== 'paid' && order.product?.stock_type === 'limited') {
        await supabase.rpc('decrement_stock_qty', { p_product_id: order.product.id })
      }

      if (order.status !== 'paid' && order.voucher_code) {
        await supabase.rpc('increment_voucher_usage', { p_code: order.voucher_code })
      }

      const { error: notifError } = await supabase.from('notifications').insert({
        type: 'order_paid',
        message: `${order.buyer_name} telah membayar ${order.product?.title || 'produk'}`,
        payload: {
          order_id: order.id,
          product_id: order.product_id,
          buyer_name: order.buyer_name,
          payment_id: normalized.paymentId,
        },
      })

      if (notifError) {
        console.error('[Mayar Webhook] Failed to create notification:', notifError)
      }
    } else if (normalized.isFailed) {
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          mayar_order_id: normalized.mayarId || order.mayar_order_id,
          mayar_payment_id: normalized.paymentId || order.mayar_payment_id,
          payment_id: normalized.paymentId || order.payment_id,
        })
        .eq('id', order.id)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('[Mayar Webhook Error]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
