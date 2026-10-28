import { NextResponse } from 'next/server'
import { createServiceClient, hasServiceRole } from '@/lib/supabase-server'
import { syncBgyReviews } from '@/lib/bgy-reviews-sync'

export const dynamic = 'force-dynamic'

// Dipanggil Vercel Cron sekali sehari (lihat vercel.json). Vercel mengirim "Authorization: Bearer <CRON_SECRET>".
export async function GET(request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasServiceRole()) return NextResponse.json({ error: 'Service role belum diatur' }, { status: 500 })
  const supabase = await createServiceClient()

  // Pesanan tidak dibayar lebih dari 48 jam -> kedaluwarsa. Bila dibayar belakangan, webhook tetap mengubahnya jadi lunas.
  const { data: expired, error } = await supabase
    .from('orders')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 48 * 3600 * 1000).toISOString())
    .select('id')
  // Sisa hitungan rate limit lama (tabel dari SQL 021; abaikan bila belum ada).
  await supabase.from('rate_limits').delete().lt('reset_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())

  // Ulasan aplikasi BGY ikut tampil di produk lisensinya.
  let reviews
  try { reviews = await syncBgyReviews(supabase) } catch (e) { reviews = { error: e.message } }

  return NextResponse.json({ expired: expired?.length || 0, reviews, error: error?.message || null })
}
