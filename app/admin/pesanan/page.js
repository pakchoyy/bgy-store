import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import { formatRupiah } from '@/lib/utils'
import AdminToast from '@/components/admin/AdminToast'
import { PrintButton, FollowUpButton, CopyLinkButton } from '@/components/admin/OrderActions'

async function generateLink(formData) {
  'use server'
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
  donasi: '☕ Donasi',
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
  const selected = searchParams?.selected
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL

  let orders = []
  if (!isDemo) {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (data && data.length > 0) {
      orders = data.map(o => {
        const type = o.product_id ? 'produk' : 'donasi'
        return {
          id: o.id,
          type,
          buyer_name: o.buyer_name || o.customer_name || 'Unknown',
          whatsapp: o.buyer_whatsapp || o.whatsapp || o.phone || '-',
          email: o.buyer_email || o.email || '-',
          product_title: type === 'donasi' ? '☕ Traktir Kopi' : (o.product_title || o.product?.title || 'Unknown'),
          price: o.price || o.amount || 0,
          status: o.status || 'pending',
          date: o.created_at ? o.created_at.slice(0, 10) : '2026-01-01',
          download_token: o.download_token || null,
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
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(o =>
      o.buyer_name.toLowerCase().includes(q) ||
      o.whatsapp.includes(q) ||
      o.email.toLowerCase().includes(q)
    )
  }

  const selectedOrder = selected ? orders.find(o => o.id === selected) : null
  const statuses = ['all', 'pending', 'paid', 'failed', 'expired']
  const types = ['all', 'produk', 'donasi']
  const baseQuery = (overrides = {}) => {
    const base = { status: statusFilter, type: typeFilter, search, ...overrides }
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(base)) {
      if (value) params.set(key, value)
    }
    return params.toString()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-lg font-extrabold text-gray-900">Kelola Pesanan</h1>
        <form method="GET" action="/admin/pesanan">
          <input type="hidden" name="status" value={statusFilter} />
          <input type="hidden" name="type" value={typeFilter} />
          <button type="submit" name="export" value="csv" className="bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </form>
      </div>
      <AdminToast toast={toast} message={toast === 'success' ? 'Link berhasil dibuat ulang' : undefined} />
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {statuses.map(s => (
            <a
              key={s}
              href={`/admin/pesanan?${baseQuery({ status: s })}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {s === 'all' ? 'Semua' : statusLabels[s]}
            </a>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {types.map(t => (
            <a
              key={t}
              href={`/admin/pesanan?${baseQuery({ type: t })}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${typeFilter === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'all' ? 'Semua Tipe' : typeLabels[t]}
            </a>
          ))}
        </div>
        <form method="GET" action="/admin/pesanan" className="flex-1 max-w-xs">
          <input type="hidden" name="status" value={statusFilter} />
          <input type="hidden" name="type" value={typeFilter} />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Cari nama, WA, atau email..."
            className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 w-full text-sm"
          />
        </form>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-white/70">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
                <tr key={order.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <a href={`/admin/pesanan?${baseQuery({ selected: order.id, toast })}`} className="font-medium text-gray-900 hover:text-[#0ea5a0]">
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
                    <a
                      href={`/admin/pesanan?${baseQuery({ selected: order.id, toast })}`}
                      className="text-xs text-[#0ea5a0] hover:text-[#0d7a8a] font-medium"
                    >
                      Detail
                    </a>
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
      <aside className="hidden space-y-4 xl:block">
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-white/70">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Order Details</h2>
            <PrintButton className="inline-flex items-center gap-1.5 rounded-xl border border-[#0ea5a0] px-3 py-1.5 text-xs font-bold text-[#0ea5a0] transition-colors hover:bg-emerald-50" />
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
                <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] px-4 py-2.5 text-sm font-bold text-white">
                  Generate Ulang Link
                </button>
              </form>
            </div>
          ) : (
            <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Pilih pesanan di kiri untuk melihat detail.</p>
          )}
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-white/70">
          <h2 className="text-sm font-bold text-gray-900">Follow Up Text</h2>
          {selectedOrder ? (
            <FollowUpButton order={selectedOrder} className="mt-3 w-full rounded-xl border border-[#0ea5a0] px-4 py-2.5 text-xs font-bold text-[#0ea5a0] hover:bg-emerald-50 transition-colors" />
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
            <a href={`/admin/pesanan?${baseQuery()}`} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              <button type="submit" className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                Generate Ulang Link Download
              </button>
            </form>
            <CopyLinkButton downloadToken={selectedOrder.download_token} className="bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors" />
          </div>
        </div>
      )}
    </div>
  )
}
