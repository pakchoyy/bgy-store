import crypto from 'crypto'

const ORDER_SELECT = '*, product:products(*)'

export async function markOrderPaid(supabase, order, { mayarId, paymentId } = {}) {
  const downloadToken = order.download_token || `${order.id}-${Date.now()}-${crypto.randomBytes(24).toString('base64url')}`
  const expiresAt = order.token_expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: updated, error } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      mayar_order_id: mayarId || order.mayar_order_id,
      mayar_payment_id: paymentId || order.mayar_payment_id,
      payment_id: paymentId || order.payment_id,
      paid_at: order.paid_at || new Date().toISOString(),
      download_token: downloadToken,
      token_expires_at: expiresAt,
    })
    .eq('id', order.id)
    .neq('status', 'paid')
    .select('id')

  if (error) throw error
  if (!updated?.length) return { alreadyPaid: true }

  if (order.product?.stock_type === 'limited') {
    await supabase.rpc('decrement_stock_qty', { p_product_id: order.product.id })
  }
  if (order.voucher_code) {
    await supabase.rpc('increment_voucher_usage', { p_code: order.voucher_code })
  }

  const { error: notifError } = await supabase.from('notifications').insert({
    type: 'order_paid',
    message: order.product_id
      ? `${order.buyer_name} telah membayar ${order.product?.title || 'produk'}`
      : `${order.buyer_name} traktir kopi Rp${Number(order.amount || 0).toLocaleString('id-ID')}`,
    payload: { order_id: order.id, product_id: order.product_id, buyer_name: order.buyer_name, payment_id: paymentId },
  })
  if (notifError) console.error('[orders] notification insert failed:', notifError)

  if (order.product_id) {
    try {
      const { sendDownloadEmail } = await import('@/lib/email')
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bgy-store.vercel.app'
      await sendDownloadEmail({
        to: order.buyer_email,
        buyerName: order.buyer_name,
        productTitle: order.product?.title,
        downloadUrl: `${siteUrl}/terima-kasih?token=${encodeURIComponent(downloadToken)}`,
        expiresAt,
      })
    } catch (emailError) {
      console.error('[orders] download email failed:', emailError)
    }
  }

  return { paid: true }
}

function invoiceIdsFor(order) {
  const fromUrl = String(order.payment_url || '').split(/[?#]/)[0].split('/').filter(Boolean).pop()
  return [...new Set([order.mayar_order_id, order.mayar_payment_id, order.payment_id, fromUrl].filter(Boolean))]
}

export async function syncOrderWithMayar(supabase, orderOrId) {
  let order = orderOrId
  if (typeof orderOrId === 'string') {
    const { data } = await supabase.from('orders').select(ORDER_SELECT).eq('id', orderOrId).maybeSingle()
    order = data
  }
  if (!order) return null
  if (order.status !== 'pending') return order.status

  const { hasMayarApiKey, getInvoice, invoiceIsPaid } = await import('@/lib/mayar')
  if (!hasMayarApiKey()) return order.status

  for (const id of invoiceIdsFor(order)) {
    try {
      const invoice = await getInvoice(id)
      if (invoiceIsPaid(invoice)) {
        await markOrderPaid(supabase, order, { mayarId: order.mayar_order_id || id })
        return 'paid'
      }
      if (invoice) return order.status
    } catch {}
  }
  return order.status
}

export async function findOrderForWebhook(supabase, { localOrderId, mayarId }) {
  if (localOrderId && /^[0-9a-f-]{36}$/i.test(localOrderId)) {
    const { data } = await supabase.from('orders').select(ORDER_SELECT).eq('id', localOrderId).maybeSingle()
    if (data) return data
  }
  if (!mayarId) return null
  for (const field of ['mayar_order_id', 'mayar_payment_id', 'payment_id']) {
    const { data } = await supabase.from('orders').select(ORDER_SELECT).eq(field, mayarId).maybeSingle()
    if (data) return data
  }
  return null
}
