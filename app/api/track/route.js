import { rateLimited, tooMany } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { createTrustedServerClient } from '@/lib/supabase-server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse/i

export async function POST(request) {
  if (rateLimited(request, 'track', 120, 60 * 1000)) return tooMany()
  if (BOT.test(request.headers.get('user-agent') || '')) return new NextResponse(null, { status: 204 })

  let body
  try {
    body = JSON.parse(await request.text())
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const eventType = body?.type
  if (eventType !== 'view' && eventType !== 'click') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  const path = typeof body.path === 'string' && body.path.startsWith('/') ? body.path.slice(0, 300) : null
  if (path?.startsWith('/admin')) return new NextResponse(null, { status: 204 })
  const productId = typeof body.product_id === 'string' && UUID.test(body.product_id) ? body.product_id : null

  const supabase = await createTrustedServerClient()
  await supabase.from('analytics_events').insert({ event_type: eventType, path, product_id: productId })
  return new NextResponse(null, { status: 204 })
}
