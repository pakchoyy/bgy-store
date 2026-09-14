const MAYAR_API_URL = process.env.MAYAR_API_URL || 'https://api.mayar.id/hl/v2'

function hasMayarApiKey() {
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
    const message = data?.messages || data?.message || `Mayar API error: ${response.status} ${response.statusText}`
    throw new Error(message)
  }

  if (data?.statusCode && data.statusCode >= 400) {
    throw new Error(data.messages || data.message || 'Mayar mengembalikan error')
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

export function verifyWebhookSignature(payload, signature) {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', process.env.MAYAR_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}
