// Baca payload webhook Mayar (bentuknya beragam) -> status lunas/gagal + id pesanan. Murni, dites di tests/.

export function normalizeWebhookPayload(parsed) {
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
