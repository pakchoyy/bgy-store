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
  const id = encodeURIComponent(invoiceId)
  try {
    const result = await requestMayar(`/invoices/${id}`)
    return result?.data || result
  } catch (primaryError) {
    const response = await fetch(`https://api.mayar.id/hl/v1/invoice/${id}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${process.env.MAYAR_API_KEY}` },
    })
    if (!response.ok) throw primaryError
    const result = await response.json().catch(() => null)
    return result?.data || result
  }
}

const PAID = /paid|settle|success|succeeded|complete/
const NOT_PAID = /unpaid|not[_\s-]?paid|unsuccess|incomplete|pending|fail|expire|cancel|void/

function isPaidStatus(value) {
  const status = String(value || '').toLowerCase()
  return !!status && PAID.test(status) && !NOT_PAID.test(status)
}

export function invoiceIsPaid(invoice) {
  if (!invoice || typeof invoice !== 'object') return false
  const statuses = [
    invoice.status,
    invoice.paymentStatus,
    invoice.payment_status,
    invoice.transactionStatus,
    invoice.transaction_status,
    invoice.invoice?.status,
    ...(Array.isArray(invoice.transactions) ? invoice.transactions.map((t) => t?.status) : []),
    ...(Array.isArray(invoice.payments) ? invoice.payments.map((t) => t?.status) : []),
  ]
  return statuses.some(isPaidStatus)
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
    const invoiceId = item.invoiceId || item.invoice_id || item.id || item.uuid
      || item.transactionId || item.transaction_id || item.paymentId || item.payment_id
    const transactionId = item.transactionId || item.transaction_id || item.paymentId || item.payment_id || null

    if (paymentUrl || invoiceId) {
      return { paymentUrl, invoiceId, transactionId }
    }
  }

  return { paymentUrl: null, invoiceId: null, transactionId: null }
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
