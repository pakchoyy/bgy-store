import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { formatRupiah } from '@/lib/utils'

async function generateLink(formData) {
  'use server'
  const id = formData.get('id')
  redirect(`/admin/pesanan?toast=success&selected=${id}`)
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

function DemoBadge() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800 flex items-center gap-2 mb-6">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span>Mode Demo — Data tidak disimpan</span>
    </div>
  )
}

function ToastBar({ toast }) {
  if (!toast) return null
  const isSuccess = toast === 'success'
  const isDemo = toast === 'demo'
  const bg = isDemo ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Link berhasil digenerate!' : 'Terjadi kesalahan'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

const demoOrders = [
  { id: 'ORD-001', buyer_name: 'Siti Nurhaliza', whatsapp: '628111111111', email: 'siti@example.com', product_title: 'Modul Ajar Matematika Kelas 1 SD', price: 0, status: 'paid', date: '2026-01-15' },
  { id: 'ORD-002', buyer_name: 'Ahmad Fauzi', whatsapp: '628222222222', email: 'ahmad@example.com', product_title: 'Media Pembelajaran Interaktif IPA Kelas 3 SD', price: 35000, status: 'paid', date: '2026-01-16' },
  { id: 'ORD-003', buyer_name: 'Dewi Lestari', whatsapp: '628333333333', email: 'dewi@example.com', product_title: 'Bundle Media Pembelajaran SD Kelas 1-6', price: 125000, status: 'pending', date: '2026-01-17' },
  { id: 'ORD-004', buyer_name: 'Budi Santoso', whatsapp: '628444444444', email: 'budi@example.com', product_title: 'Administrasi Guru Kelas 4 SD Full Tahun', price: 45000, status: 'failed', date: '2026-01-18' },
  { id: 'ORD-005', buyer_name: 'Rina Wulandari', whatsapp: '628555555555', email: 'rina@example.com', product_title: 'Template Sertifikat Kelulusan SD', price: 25000, status: 'expired', date: '2026-01-19' },
  { id: 'ORD-006', buyer_name: 'Hendra Gunawan', whatsapp: '628666666666', email: 'hendra@example.com', product_title: 'ATP Bahasa Indonesia Kelas 2 SD', price: 0, status: 'paid', date: '2026-01-20' },
]

export default async function AdminPesanan({ searchParams }) {
  const supabase = await createClient()
  const toast = searchParams?.toast
  const statusFilter = searchParams?.status || 'all'
  const search = searchParams?.search || ''
  const selected = searchParams?.selected
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL

  let orders = []
  if (!isDemo) {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (data && data.length > 0) {
      orders = data.map(o => ({
        id: o.id,
        buyer_name: o.buyer_name || o.customer_name || 'Unknown',
        whatsapp: o.whatsapp || o.phone || '-',
        email: o.email || '-',
        product_title: o.product_title || o.product?.title || 'Unknown',
        price: o.price || o.amount || 0,
        status: o.status || 'pending',
        date: o.created_at ? o.created_at.slice(0, 10) : '2026-01-01',
      }))
    }
  }
  if (orders.length === 0) orders = demoOrders

  let filtered = orders
  if (statusFilter !== 'all') {
    filtered = filtered.filter(o => o.status === statusFilter)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-lg font-extrabold text-gray-900">Kelola Pesanan</h1>
        <form method="GET" action="/admin/pesanan">
          <input type="hidden" name="status" value={statusFilter} />
          <button type="submit" name="export" value="csv" className="bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </form>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {statuses.map(s => {
            const href = search ? `/admin/pesanan?status=${s}&search=${search}` : `/admin/pesanan?status=${s}`
            return (
              <a
                key={s}
                href={href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {s === 'all' ? 'Semua' : statusLabels[s]}
              </a>
            )
          })}
        </div>
        <form method="GET" action="/admin/pesanan" className="flex-1 max-w-xs">
          <input type="hidden" name="status" value={statusFilter} />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Cari nama, WA, atau email..."
            className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 w-full text-sm"
          />
        </form>
      </div>
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
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
                    <a href={`/admin/pesanan?status=${statusFilter}&search=${search}&selected=${order.id}${toast ? `&toast=${toast}` : ''}`} className="font-medium text-gray-900 hover:text-[#0ea5a0]">
                      {order.buyer_name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                    <div>{order.whatsapp}</div>
                    <div className="truncate max-w-[150px]">{order.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs hidden lg:table-cell truncate max-w-[200px]">{order.product_title}</td>
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
                      href={`/admin/pesanan?status=${statusFilter}&search=${search}&selected=${order.id}${toast ? `&toast=${toast}` : ''}`}
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
      {selectedOrder && (
        <div className="mt-6 bg-white rounded-xl shadow-card p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Detail Pesanan — {selectedOrder.id}</h3>
            <a href={`/admin/pesanan?status=${statusFilter}&search=${search}`} className="text-gray-400 hover:text-gray-600">
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
              <span className="font-medium text-gray-900">{selectedOrder.product_title}</span>
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
            <button onClick={async () => {
              try { await navigator.clipboard.writeText(`${window.location.origin}/download/${selectedOrder.id}`) } catch {}
            }} className="bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
