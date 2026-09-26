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

  const items = await getOrderItems(supabase, order)
  const limitedIds = items.length
    ? (await supabase.from('products').select('id, stock_type').in('id', items.map((i) => i.product_id).filter(Boolean))).data
        ?.filter((p) => p.stock_type === 'limited').map((p) => p.id) || []
    : order.product?.stock_type === 'limited' ? [order.product.id] : []
  for (const productId of limitedIds) {
    await supabase.rpc('decrement_stock_qty', { p_product_id: productId })
  }
  const itemTitle = items.length > 1 ? `${items.length} produk` : order.product?.title || 'produk'
  if (order.voucher_code) {
    await supabase.rpc('increment_voucher_usage', { p_code: order.voucher_code })
  }

  const { error: notifError } = await supabase.from('notifications').insert({
    type: 'order_paid',
    message: order.product_id
      ? `${order.buyer_name} telah membayar ${itemTitle}`
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
        productTitle: items.length > 1 ? items.map((i) => i.title).join(', ') : order.product?.title,
        downloadUrl: `${siteUrl}/terima-kasih?token=${encodeURIComponent(downloadToken)}`,
        expiresAt,
      })
    } catch (emailError) {
      console.error('[orders] download email failed:', emailError)
    }
  }

  try {
    const { sendAdminOrderEmail } = await import('@/lib/email')
    await sendAdminOrderEmail({
      buyerName: order.buyer_name,
      buyerWhatsapp: order.buyer_whatsapp,
      title: order.product_id ? (items.length > 1 ? items.map((i) => i.title).join(', ') : order.product?.title) : 'Traktir Kopi ☕',
      amount: order.amount,
      isTip: !order.product_id,
    })
  } catch (adminEmailError) {
    console.error('[orders] admin email failed:', adminEmailError)
  }

  return { paid: true }
}

export async function getOrderItems(supabase, order) {
  if (!order?.id || !order.product_id) return []
  const { data, error } = await supabase.from('order_items').select('product_id, title, price').eq('order_id', order.id).order('id')
  return error ? [] : data || []
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
