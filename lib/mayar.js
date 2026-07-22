const MAYAR_API_URL = 'https://api.mayar.id/hl/v1'

export async function createPaymentLink({ amount, name, description, redirectUrl, customer }) {
  const response = await fetch(`${MAYAR_API_URL}/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MAYAR_API_KEY}`,
    },
    body: JSON.stringify({
      amount,
      name,
      description,
      redirectUrl,
      customer,
    }),
  })

  if (!response.ok) {
    throw new Error(`Mayar API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

export function verifyWebhookSignature(payload, signature) {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', process.env.MAYAR_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}
