import { NextResponse } from 'next/server'
import { createTrustedServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const orderId = new URL(request.url).searchParams.get('order') || ''
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: 'Order tidak valid' }, { status: 400 })
  }
  const supabase = await createTrustedServerClient()
  const { data } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle()
  return NextResponse.json(
    { status: data?.status || 'unknown' },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
