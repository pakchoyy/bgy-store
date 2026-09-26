import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'
import { csvRow as row, csvResponse } from '@/lib/csv'

export const dynamic = 'force-dynamic'


export async function GET(request) {
  const supabase = await createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const month = new URL(request.url).searchParams.get('month') || ''
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  if (!match) return Response.json({ error: 'Format bulan harus YYYY-MM' }, { status: 400 })
  const [year, mon] = [Number(match[1]), Number(match[2])]
  const start = new Date(`${match[1]}-${match[2]}-01T00:00:00+07:00`)
  const endMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`
  const end = new Date(`${endMonth}-01T00:00:00+07:00`)

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, created_at, buyer_name, buyer_whatsapp, buyer_email, amount, status, voucher_code, product_id, product:products(title)')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .order('created_at')
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const ids = (orders || []).map((o) => o.id)
  const itemsByOrder = {}
  if (ids.length) {
    const { data: items, error: itemsError } = await supabase.from('order_items').select('order_id, title, price').in('order_id', ids)
    if (!itemsError) for (const item of items || []) (itemsByOrder[item.order_id] ||= []).push(item)
  }

  const paid = (orders || []).filter((o) => o.status === 'paid')
  const productOrders = paid.filter((o) => o.product_id)
  const tips = paid.filter((o) => !o.product_id)
  const sum = (list) => list.reduce((total, o) => total + Number(o.amount || 0), 0)

  const perProduct = {}
  for (const order of productOrders) {
    const items = itemsByOrder[order.id]
    if (items?.length) {
      for (const item of items) {
        perProduct[item.title] ||= { sold: 0, revenue: 0 }
        perProduct[item.title].sold += 1
        perProduct[item.title].revenue += Number(item.price || 0)
      }
    } else {
      const title = order.product?.title || 'Produk dihapus'
      perProduct[title] ||= { sold: 0, revenue: 0 }
      perProduct[title].sold += 1
      perProduct[title].revenue += Number(order.amount || 0)
    }
  }

  const monthLabel = start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
  const itemLabel = (o) => !o.product_id ? 'Traktir Kopi' : itemsByOrder[o.id]?.length > 1 ? itemsByOrder[o.id].map((i) => i.title).join(' + ') : o.product?.title || 'Produk dihapus'
  const statusLabel = { paid: 'Lunas', pending: 'Pending', failed: 'Gagal', expired: 'Kedaluwarsa' }

  const lines = [
    row('Laporan Bulanan Bantu Guru Yuk', monthLabel),
    '',
    row('RINGKASAN'),
    row('Pendapatan produk', sum(productOrders)),
    row('Traktir kopi', sum(tips)),
    row('Total pemasukan', sum(paid)),
    row('Pesanan produk lunas', productOrders.length),
    row('Jumlah traktir', tips.length),
    row('Pesanan belum dibayar / gagal', (orders || []).length - paid.length),
    '',
    row('PRODUK TERLARIS'),
    row('Produk', 'Terjual', 'Pendapatan (harga normal)'),
    ...Object.entries(perProduct).sort((a, b) => b[1].sold - a[1].sold).map(([title, v]) => row(title, v.sold, v.revenue)),
    '',
    row('DETAIL TRANSAKSI'),
    row('Tanggal', 'Nama', 'WhatsApp', 'Email', 'Item', 'Total', 'Status', 'Voucher'),
    ...(orders || []).map((o) => row(
      new Date(o.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      o.buyer_name,
      o.buyer_whatsapp,
      o.buyer_email,
      itemLabel(o),
      Number(o.amount || 0),
      statusLabel[o.status] || o.status,
      o.voucher_code || '',
    )),
  ]

  return csvResponse(lines, `laporan-bgy-${month}.csv`)
}
