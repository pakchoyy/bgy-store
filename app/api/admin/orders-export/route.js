import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'
import { csvRow, csvResponse } from '@/lib/csv'

export const dynamic = 'force-dynamic'

const STATUS = { paid: 'Lunas', pending: 'Pending', failed: 'Gagal', expired: 'Kedaluwarsa' }

export async function GET(request) {
  const supabase = await createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const params = new URL(request.url).searchParams
  const status = params.get('status')
  const type = params.get('type')

  let query = supabase
    .from('orders')
    .select('id, created_at, buyer_name, buyer_whatsapp, buyer_email, amount, status, voucher_code, product_id, product:products(title)')
    .order('created_at', { ascending: false })
  if (status && STATUS[status]) query = query.eq('status', status)
  if (type === 'produk') query = query.not('product_id', 'is', null)
  if (type === 'donasi') query = query.is('product_id', null)
  const { data: orders, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const itemsByOrder = {}
  const { data: items, error: itemsError } = await supabase.from('order_items').select('order_id, title')
  if (!itemsError) for (const item of items || []) (itemsByOrder[item.order_id] ||= []).push(item.title)

  const lines = [
    csvRow('Tanggal', 'Nama', 'WhatsApp', 'Email', 'Item', 'Tipe', 'Total', 'Status', 'Voucher'),
    ...(orders || []).map((o) => csvRow(
      new Date(o.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      o.buyer_name,
      o.buyer_whatsapp,
      o.buyer_email,
      !o.product_id ? 'Traktir Kopi' : itemsByOrder[o.id]?.length > 1 ? itemsByOrder[o.id].join(' + ') : o.product?.title || 'Produk dihapus',
      o.product_id ? 'Produk' : 'Traktir',
      Number(o.amount || 0),
      STATUS[o.status] || o.status,
      o.voucher_code || '',
    )),
  ]
  return csvResponse(lines, `pesanan-bgy-${new Date().toISOString().slice(0, 10)}.csv`)
}
