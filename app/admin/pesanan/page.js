import { fetchAll } from '@/lib/fetch-all'
import { assertAdminAction } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import { formatRupiah } from '@/lib/utils'
import AdminToast from '@/components/admin/AdminToast'
import { DEFAULT_WA_MESSAGE, getWaMessage, waPhone } from '@/lib/wa-message'
import { PrintButton, FollowUpButton, CopyLinkButton, ConfirmSubmitButton } from '@/components/admin/OrderActions'

async function generateLink(formData) {
  'use server'
  await assertAdminAction()
  const id = formData.get('id')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect(`/admin/pesanan?toast=success&selected=${id}`)

  const supabase = await createClient()
  const token = `${id}-${Date.now()}-${crypto.randomBytes(24).toString('base64url')}`
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from('orders')
    .update({ download_token: token, token_expires_at: expiresAt })
    .eq('id', id)

  redirect(`/admin/pesanan?toast=${error ? 'error' : 'success'}&selected=${id}`)
}

// Tandai lunas manual: dipakai kalau pembayaran sudah dicek benar masuk di dashboard Mayar tapi status toko masih pending.
// Mengirim email link download ke pembeli seperti pembayaran biasa.
async function markPaidManual(formData) {
  'use server'
  await assertAdminAction()
  const id = String(formData.get('id') || '')
  const back = formData.get('back') || ''
  if (!/^[0-9a-f-]{36}$/i.test(id) || !process.env.NEXT_PUBLIC_SUPABASE_URL) redirect(`/admin/pesanan?${back}`)
  const { createServiceClient } = await import('@/lib/supabase-server')
  const supabase = await createServiceClient()
  const { data: order } = await supabase.from('orders').select('*, product:products(*)').eq('id', id).maybeSingle()
  const params = new URLSearchParams(back)
  params.set('selected', id)
  if (!order || order.status === 'paid') {
    params.set('toast', 'error')
    redirect(`/admin/pesanan?${params.toString()}`)
  }
  const { markOrderPaid } = await import('@/lib/orders')
  let ok = true
  try { await markOrderPaid(supabase, order, {}) } catch (e) { console.error('[admin] tandai lunas gagal:', e); ok = false }
  params.set('toast', ok ? 'paid' : 'error')
  redirect(`/admin/pesanan?${params.toString()}`)
}

async function markRead(formData) {
  'use server'
  await assertAdminAction()
  const id = formData.get('id')
  const back = formData.get('back') || ''
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect(`/admin/pesanan?${back}`)
  const supabase = await createClient()
  const query = supabase.from('orders').update({ admin_read_at: new Date().toISOString() }).is('admin_read_at', null)
  const { error } = id ? await query.eq('id', id) : await query
  const params = new URLSearchParams(back)
  params.set('toast', error ? 'error' : 'read')
  redirect(`/admin/pesanan?${params.toString()}`)
}

async function deleteOrder(formData) {
  'use server'
  await assertAdminAction()
  const id = formData.get('id')
  const back = formData.get('back') || ''
  if (!id || !process.env.NEXT_PUBLIC_SUPABASE_URL) redirect(`/admin/pesanan?${back}`)
  const supabase = await createClient()
  const { error } = await supabase.from('orders').delete().eq('id', id)
  const params = new URLSearchParams(back)
  params.delete('selected')
  params.set('toast', error ? 'error' : 'deleted')
  redirect(`/admin/pesanan?${params.toString()}`)
}

const trashIcon = (
  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M10 11v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
)

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-600',
}

const statusLabels = {
  pending: 'Pending',
  paid: 'Lunas',
  failed: 'Gagal',
  expired: 'Kadaluarsa',
}

const typeLabels = {
  produk: 'Produk',
  donasi: '☕ Traktir',
}

const typeColors = {
  produk: 'bg-blue-100 text-blue-700',
  donasi: 'bg-amber-100 text-amber-700',
}

export default async function AdminPesanan({ searchParams }) {
  const supabase = await createClient()
  const toast = searchParams?.toast
  const statusFilter = searchParams?.status || 'all'
  const typeFilter = searchParams?.type || 'all'
  const search = searchParams?.search || ''
  const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '')
  const from = isDate(searchParams?.from) ? searchParams.from : ''
  const to = isDate(searchParams?.to) ? searchParams.to : ''
  const selected = searchParams?.selected
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL

  let orders = []
  let waMessage = DEFAULT_WA_MESSAGE
  if (!isDemo) {
    // Pending lebih dari 48 jam ditampilkan sebagai kedaluwarsa; status di database diubah oleh cron harian (/api/cron/daily).
    waMessage = await getWaMessage(supabase)
    const staleBefore = Date.now() - 48 * 3600 * 1000
    const { data } = await fetchAll(() => supabase.from('orders').select('*, product:products(title)').order('created_at', { ascending: false }).order('id'))
    const { data: itemRows, error: itemsError } = await fetchAll(() => supabase.from('order_items').select('order_id, title').order('id'))
    const itemsByOrder = {}
    if (!itemsError) for (const row of itemRows || []) (itemsByOrder[row.order_id] ||= []).push(row.title)
    if (data && data.length > 0) {
      orders = data.map(o => {
        const type = o.product_id ? 'produk' : 'donasi'
        return {
          id: o.id,
          type,
          buyer_name: o.buyer_name || o.customer_name || 'Unknown',
          whatsapp: o.buyer_whatsapp || o.whatsapp || o.phone || '-',
          email: o.buyer_email || o.email || '-',
          product_title: type === 'donasi'
            ? '☕ Traktir Kopi'
            : itemsByOrder[o.id]?.length > 1
              ? `${itemsByOrder[o.id].length} produk: ${itemsByOrder[o.id].join(', ')}`
              : (o.product_title || o.product?.title || 'Produk dihapus'),
          price: o.price || o.amount || 0,
          status: o.status === 'pending' && o.created_at && new Date(o.created_at).getTime() < staleBefore ? 'expired' : (o.status || 'pending'),
          // tanggal WIB (UTC+7)
          date: o.created_at ? new Date(new Date(o.created_at).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10) : '2026-01-01',
          download_token: o.download_token || null,
          unread: o.admin_read_at === null,
        }
      })
    }
  }

  let filtered = orders
  if (statusFilter !== 'all') {
    filtered = filtered.filter(o => o.status === statusFilter)
  }
  if (typeFilter !== 'all') {
    filtered = filtered.filter(o => o.type === typeFilter)
  }
  if (from) filtered = filtered.filter(o => o.date >= from)
  if (to) filtered = filtered.filter(o => o.date <= to)
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(o =>
      o.buyer_name.toLowerCase().includes(q) ||
      o.whatsapp.includes(q) ||
      o.email.toLowerCase().includes(q)
    )
  }

  const selectedOrder = selected ? orders.find(o => o.id === selected) : null
  const unreadCount = orders.filter(o => o.unread).length
  const statuses = ['all', 'pending', 'paid', 'failed', 'expired']
  const types = ['all', 'produk', 'donasi']
  const baseQuery = (overrides = {}) => {
    const base = { status: statusFilter, type: typeFilter, search, from, to, ...overrides }
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(base)) {
      if (value) params.set(key, value)
    }
    return params.toString()
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-extrabold text-gray-900">
          Kelola Pesanan
          {unreadCount > 0 && <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 align-middle text-xs font-bold text-white">{unreadCount} baru</span>}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
        {unreadCount > 0 && (
          <form action={markRead}>
            <input type="hidden" name="back" value={baseQuery({ toast: '' })} />
            <button type="submit" className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800">
              ✓ Tandai semua dibaca
            </button>
          </form>
        )}
        <form method="GET" action="/api/admin/orders-export">
          <input type="hidden" name="status" value={statusFilter} />
          <input type="hidden" name="type" value={typeFilter} />
          {from && <input type="hidden" name="from" value={from} />}
          {to && <input type="hidden" name="to" value={to} />}
          <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </form>
        </div>
      </div>
      <AdminToast toast={toast === 'read' || toast === 'deleted' || toast === 'paid' ? 'success' : toast} message={toast === 'read' ? 'Pesanan ditandai sudah dibaca' : toast === 'paid' ? 'Pesanan ditandai lunas, email link download dikirim' : toast === 'deleted' ? 'Pesanan dihapus' : toast === 'success' ? 'Link berhasil dibuat ulang' : undefined} />
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {statuses.map(s => (
            <a
              key={s}
              href={`/admin/pesanan?${baseQuery({ status: s })}`}
              className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${statusFilter === s ? 'bg-emerald-700 text-white' : 'bg-white text-gray-500 ring-1 ring-gray-200'}`}
            >
              {s === 'all' ? 'Semua' : statusLabels[s]}
            </a>
          ))}
        </div>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {types.map(t => (
            <a
              key={t}
              href={`/admin/pesanan?${baseQuery({ type: t })}`}
              className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${typeFilter === t ? 'bg-slate-800 text-white' : 'bg-white text-gray-500 ring-1 ring-gray-200'}`}
            >
              {t === 'all' ? 'Semua Tipe' : typeLabels[t]}
            </a>
          ))}
        </div>
        <form method="GET" action="/admin/pesanan" className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-1 sm:flex-wrap sm:items-end">
          <input type="hidden" name="status" value={statusFilter} />
          <input type="hidden" name="type" value={typeFilter} />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Cari nama, WA, atau email..."
            className="col-span-2 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm sm:max-w-xs"
          />
          <label className="text-xs font-semibold text-gray-500">Dari tanggal
            <input type="date" name="from" defaultValue={from} className="mt-1 block h-11 w-full rounded-xl border border-gray-300 bg-white px-2 text-sm text-gray-900" />
          </label>
          <label className="text-xs font-semibold text-gray-500">Sampai tanggal
            <input type="date" name="to" defaultValue={to} className="mt-1 block h-11 w-full rounded-xl border border-gray-300 bg-white px-2 text-sm text-gray-900" />
          </label>
          <button type="submit" className={`h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 ${from || to || search ? '' : 'col-span-2'}`}>Terapkan</button>
          {(from || to || search) && (
            <a href={`/admin/pesanan?${baseQuery({ from: '', to: '', search: '' })}`} className="flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-gray-600 ring-1 ring-gray-200">Reset</a>
          )}
        </form>
        {(from || to) && (
          <p className="w-full text-xs text-gray-500">
            {filtered.length} pesanan · lunas {formatRupiah(filtered.filter(o => o.status === 'paid').reduce((sum, o) => sum + Number(o.price || 0), 0))}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-2 md:hidden">
        {filtered.map(order => (
          <div key={order.id} className={`flex items-center gap-2 rounded-xl bg-white pr-2 shadow-sm ${selectedOrder?.id === order.id ? 'ring-2 ring-emerald-400' : ''}`}>
          <a
            href={`/admin/pesanan?${baseQuery({ selected: order.id, toast: '' })}`}
            className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5"
          >
            <span className="min-w-0 flex-1">
              <span className={`flex items-center gap-1.5 truncate text-sm ${order.unread ? 'font-bold text-gray-950' : 'font-medium text-gray-800'}`}>
                {order.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Belum dibaca" />}
                <span className="truncate">{order.buyer_name}</span>
              </span>
              <span className="block truncate text-xs text-gray-500">{order.type === 'produk' ? order.product_title : typeLabels[order.type]} · {order.date}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-semibold text-gray-900">{order.price === 0 ? 'Gratis' : formatRupiah(order.price)}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>{statusLabels[order.status] || order.status}</span>
            </span>
          </a>
          {/* Ucapan WA untuk pembeli produk digital yang sudah lunas */}
          {order.type === 'produk' && order.status === 'paid' && waPhone(order.whatsapp).length >= 10 && (
            <a
              href={`https://wa.me/${waPhone(order.whatsapp)}?text=${encodeURIComponent(waMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Kirim ucapan WA ke ${order.buyer_name}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.96]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5 5.4 16A8 8 0 1 1 8 18.6L4 19.5Z" /></svg>
            </a>
          )}
          </div>
        ))}
        {filtered.length === 0 && <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-400">Tidak ada pesanan ditemukan</div>}
      </div>
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-white/70 md:block">
        <div className="overflow-x-auto">
          <table className="keep-table w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Pembeli</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Kontak</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Produk</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Harga</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden sm:table-cell">Tanggal</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(order => (
                <tr key={order.id} className={order.unread ? 'bg-emerald-50/70 hover:bg-emerald-50' : 'hover:bg-gray-50/50'}>
                  <td className="px-4 py-3">
                    <a href={`/admin/pesanan?${baseQuery({ selected: order.id, toast: '' })}`} className={`inline-flex items-center gap-2 hover:text-emerald-500 ${order.unread ? 'font-bold text-gray-950' : 'font-medium text-gray-900'}`}>
                      {order.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Belum dibaca" />}
                      {order.buyer_name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                    <div>{order.whatsapp}</div>
                    <div className="truncate max-w-[150px]">{order.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs hidden lg:table-cell truncate max-w-[200px]">
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5 ${typeColors[order.type]}`}>{typeLabels[order.type]}</span>
                    {order.type === 'produk' && <span className="text-gray-700">{order.product_title}</span>}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {order.price === 0 ? (
                      <span className="text-green-600 text-xs font-semibold">Gratis</span>
                    ) : (
                      <span className="text-gray-900">{formatRupiah(order.price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{order.date}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {order.unread && (
                        <form action={markRead}>
                          <input type="hidden" name="id" value={order.id} />
                          <input type="hidden" name="back" value={baseQuery({ toast: '' })} />
                          <button type="submit" aria-label={`Tandai pesanan ${order.buyer_name} dibaca`} className="whitespace-nowrap text-xs font-semibold text-gray-500 hover:text-gray-800">✓ Dibaca</button>
                        </form>
                      )}
                      <a
                        href={`/admin/pesanan?${baseQuery({ selected: order.id, toast: '' })}`}
                        className="text-xs text-emerald-500 hover:text-emerald-700 font-medium"
                      >
                        Detail
                      </a>
                      <form action={deleteOrder}>
                        <input type="hidden" name="id" value={order.id} />
                        <input type="hidden" name="back" value={baseQuery({ toast: '' })} />
                        <ConfirmSubmitButton
                          message={`Hapus pesanan ${order.buyer_name}? Tindakan ini tidak bisa dibatalkan.`}
                          aria-label={`Hapus pesanan ${order.buyer_name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          {trashIcon}
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400">Tidak ada pesanan ditemukan</div>
        )}
      </div>
      <aside className={`${selectedOrder ? 'order-first xl:order-none' : 'hidden'} space-y-4 xl:block`}>
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-white/70">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Detail Pesanan</h2>
            <div className="flex items-center gap-2">
            <a href={`/admin/pesanan?${baseQuery({ selected: '', toast: '' })}`} className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 xl:hidden">✕ Tutup</a>
            <PrintButton className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500 px-3 py-1.5 text-xs font-bold text-emerald-500 transition-colors hover:bg-emerald-50" />
            </div>
          </div>
          {selectedOrder ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-emerald-50 p-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-emerald-700">Order item</p>
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${typeColors[selectedOrder.type]}`}>{typeLabels[selectedOrder.type]}</span>
                </div>
                <p className="mt-1 font-bold text-gray-900">{selectedOrder.product_title}</p>
                <p className="text-xs text-gray-500">{selectedOrder.price === 0 ? 'Gratis' : formatRupiah(selectedOrder.price)}</p>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Customer</span><span className="font-semibold text-gray-900">{selectedOrder.buyer_name}</span></div>
              <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Status</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[selectedOrder.status] || 'bg-gray-100 text-gray-600'}`}>{statusLabels[selectedOrder.status] || selectedOrder.status}</span></div>
              <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Total</span><span className="font-bold text-gray-900">{selectedOrder.price === 0 ? 'Gratis' : formatRupiah(selectedOrder.price)}</span></div>
              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
                <p className="font-semibold text-gray-700">Kontak</p>
                <p>{selectedOrder.email}</p>
                <p>{selectedOrder.whatsapp}</p>
              </div>
              <form action={generateLink}>
                <input type="hidden" name="id" value={selectedOrder.id} />
                <button type="submit" className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 min-h-11 px-4 py-2.5 text-sm font-bold text-white">
                  Generate Ulang Link
                </button>
              </form>
              {selectedOrder.status !== 'paid' && selectedOrder.type === 'produk' && (
                <form action={markPaidManual}>
                  <input type="hidden" name="id" value={selectedOrder.id} />
                  <input type="hidden" name="back" value={baseQuery({ toast: '' })} />
                  <ConfirmSubmitButton
                    title="Tandai sudah lunas?"
                    message={`Pastikan uang ${formatRupiah(selectedOrder.price)} dari ${selectedOrder.buyer_name} sudah masuk di dashboard Mayar. Pembeli akan langsung dikirimi email link download.`}
                    className="flex min-h-11 w-full items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    ✓ Tandai Lunas (sudah dicek di Mayar)
                  </ConfirmSubmitButton>
                </form>
              )}
              <form action={deleteOrder}>
                <input type="hidden" name="id" value={selectedOrder.id} />
                <input type="hidden" name="back" value={baseQuery({ toast: '' })} />
                <ConfirmSubmitButton
                  message={`Hapus pesanan ${selectedOrder.buyer_name}? Tindakan ini tidak bisa dibatalkan.`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                >
                  {trashIcon}
                  Hapus Pesanan
                </ConfirmSubmitButton>
              </form>
            </div>
          ) : (
            <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Pilih pesanan di kiri untuk melihat detail.</p>
          )}
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-white/70">
          <h2 className="text-sm font-bold text-gray-900">Kirim ke Pembeli</h2>
          {selectedOrder ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <FollowUpButton order={selectedOrder} />
              {selectedOrder.download_token && <CopyLinkButton downloadToken={selectedOrder.download_token} />}
            </div>
          ) : (
            <p className="mt-3 text-xs text-gray-400">Pilih pesanan untuk mengirim follow up.</p>
          )}
        </div>
      </aside>
      </div>
      {selectedOrder && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-card xl:hidden">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Detail Pesanan — {selectedOrder.id}</h3>
            <a href={`/admin/pesanan?${baseQuery({ toast: '' })}`} aria-label="Tutup detail" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-md shadow-red-500/30 ring-2 ring-red-100 hover:bg-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-400 block">Nama Pembeli</span>
              <span className="font-medium text-gray-900">{selectedOrder.buyer_name}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">WhatsApp</span>
              <span className="font-medium text-gray-900">{selectedOrder.whatsapp}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Email</span>
              <span className="font-medium text-gray-900">{selectedOrder.email}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Produk</span>
              <span className="inline-flex items-center gap-1.5">
                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${typeColors[selectedOrder.type]}`}>{typeLabels[selectedOrder.type]}</span>
                {selectedOrder.type === 'produk' && <span className="font-medium text-gray-900">{selectedOrder.product_title}</span>}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Harga</span>
              <span className="font-medium text-gray-900">{selectedOrder.price === 0 ? 'Gratis' : formatRupiah(selectedOrder.price)}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Status</span>
              <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full mt-0.5 ${statusColors[selectedOrder.status] || 'bg-gray-100 text-gray-600'}`}>
                {statusLabels[selectedOrder.status] || selectedOrder.status}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Tanggal</span>
              <span className="font-medium text-gray-900">{selectedOrder.date}</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
            <form action={generateLink}>
              <input type="hidden" name="id" value={selectedOrder.id} />
              <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white min-h-11 text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                Generate Ulang Link Download
              </button>
            </form>
            <FollowUpButton order={selectedOrder} />
            <CopyLinkButton downloadToken={selectedOrder.download_token} />
            <form action={deleteOrder}>
              <input type="hidden" name="id" value={selectedOrder.id} />
              <input type="hidden" name="back" value={baseQuery({ toast: '' })} />
              <ConfirmSubmitButton
                message={`Hapus pesanan ${selectedOrder.buyer_name}? Tindakan ini tidak bisa dibatalkan.`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                {trashIcon}
                Hapus Pesanan
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
