import { NextResponse } from 'next/server'
import { createServiceClient, hasServiceRole } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const HOUR = 60 * 60 * 1000

export async function GET(request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasServiceRole()) return NextResponse.json({ error: 'Service role belum dikonfigurasi' }, { status: 500 })

  const supabase = await createServiceClient()
  const { data: pending, error } = await supabase
    .from('orders')
    .select('*, product:products(*)')
    .eq('status', 'pending')
    .not('product_id', 'is', null)
    .is('reminder_sent_at', null)
    .gte('created_at', new Date(Date.now() - 72 * HOUR).toISOString())
    .lte('created_at', new Date(Date.now() - HOUR).toISOString())
    .limit(40)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { syncOrderWithMayar, getOrderItems } = await import('@/lib/orders')
  const { sendPaymentReminderEmail } = await import('@/lib/email')
  const result = { checked: 0, nowPaid: 0, reminded: 0 }

  for (const order of pending || []) {
    result.checked += 1
    const status = await syncOrderWithMayar(supabase, order).catch(() => order.status)
    if (status === 'paid') {
      result.nowPaid += 1
      continue
    }
    try {
      const items = await getOrderItems(supabase, order)
      const sent = await sendPaymentReminderEmail({
        to: order.buyer_email,
        buyerName: order.buyer_name,
        productTitle: items.length > 1 ? `${items.length} produk` : order.product?.title,
        amount: order.amount,
        paymentUrl: order.payment_url,
      })
      if (sent.sent) result.reminded += 1
    } catch (sendError) {
      console.error('[cron] reminder failed:', order.id, sendError)
      continue
    }
    await supabase.from('orders').update({ reminder_sent_at: new Date().toISOString() }).eq('id', order.id)
  }

  return NextResponse.json(result)
}
