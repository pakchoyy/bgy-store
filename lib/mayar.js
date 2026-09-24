const MAYAR_API_URL = process.env.MAYAR_API_URL || 'https://api.mayar.id/hl/v2'

export function hasMayarApiKey() {
  return process.env.MAYAR_API_KEY && !process.env.MAYAR_API_KEY.startsWith('your_')
}

async function requestMayar(path, options = {}) {
  if (!hasMayarApiKey()) {
    throw new Error('Mayar API key belum dikonfigurasi')
  }

  const response = await fetch(`${MAYAR_API_URL}${path}`, {
    ...options,
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MAYAR_API_KEY}`,
      ...(options.headers || {}),
    },
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const rawMessage = data?.messages || data?.message || data?.error
    const message = typeof rawMessage === 'string'
      ? rawMessage
      : rawMessage
        ? JSON.stringify(rawMessage)
        : `Mayar API error: ${response.status} ${response.statusText}`
    throw new Error(message)
  }

  if (data?.statusCode && data.statusCode >= 400) {
    const rawMessage = data.messages || data.message || data.error
    throw new Error(typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage || 'Mayar mengembalikan error'))
  }

  return data
}

export async function createPaymentLink({ amount, name, description, redirectUrl, customer, expiredAt }) {
  return requestMayar('/invoices/create', {
    method: 'POST',
    body: JSON.stringify({
      name: customer.name,
      email: customer.email,
      mobile: customer.phone,
      redirectUrl,
      description,
      expiredAt,
      items: [
        {
          quantity: 1,
          rate: amount,
          description: name || description,
        },
      ],
    }),
  })
}

export async function getInvoice(invoiceId) {
  const result = await requestMayar(`/invoices/${encodeURIComponent(invoiceId)}`)
  return result.data
}

export function extractMayarInvoice(response) {
  const data = response?.data || response || {}
  const candidates = [data, data.invoice, data.transaction, data.payment].filter(Boolean)

  for (const item of candidates) {
    const paymentUrl = item.paymentUrl
      || item.payment_url
      || item.invoiceUrl
      || item.invoice_url
      || item.checkoutUrl
      || item.checkout_url
      || item.link
      || item.url
    const invoiceId = item.invoiceId
      || item.invoice_id
      || item.transactionId
      || item.transaction_id
      || item.paymentId
      || item.payment_id
      || item.id
      || item.uuid

    if (paymentUrl || invoiceId) {
      return { paymentUrl, invoiceId }
    }
  }

  return { paymentUrl: null, invoiceId: null }
}

export function verifyWebhookSignature(payload, signature) {
  const crypto = require('crypto')
  if (!process.env.MAYAR_WEBHOOK_SECRET || process.env.MAYAR_WEBHOOK_SECRET.startsWith('your_')) {
    return false
  }

  if (!signature) {
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.MAYAR_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')
  const received = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)

  if (received.length !== expected.length) {
    return false
  }

  return crypto.timingSafeEqual(received, expected)
}
