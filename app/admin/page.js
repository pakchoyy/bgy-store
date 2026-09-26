import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'
import RevenueChart from '@/components/admin/RevenueChart'

async function getDashboardData() {
  const empty = { products: [], orders: [], events: [] }
  try {
    const supabase = await createClient()
    const since = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    const [{ data: products }, { data: orders }, { data: events }] = await Promise.all([
      supabase.from('products').select('*, category:categories(*)').is('deleted_at', null),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('analytics_events').select('event_type, created_at').gte('created_at', since).limit(50000),
    ])
    return { products: products || [], orders: orders || [], events: events || [] }
  } catch {}
  return empty
}

export default async function AdminDashboard() {
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
  if (!isDemo) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')
  }

  const { products, orders, events } = await getDashboardData()
  const dayKey = (value) => new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const eventsByDay = {}
  for (const event of events) {
    const key = dayKey(event.created_at)
    eventsByDay[key] ||= { view: 0, click: 0 }
    eventsByDay[key][event.event_type] = (eventsByDay[key][event.event_type] || 0) + 1
  }
  const today = new Date().toISOString().slice(0, 10)
  const monthKey = new Date().toISOString().slice(0, 7)

  const activeProducts = products.filter(p => p.is_active)
  const totalDownloads = products.reduce((sum, p) => sum + (p.download_count || 0), 0)
  const paidOrders = orders.filter(o => o.status === 'paid')
  const monthlyRevenue = paidOrders
    .filter(o => String(o.created_at || '').startsWith(monthKey))
    .reduce((sum, o) => sum + (o.amount || o.price || 0), 0)
  const dailyOrders = orders.filter(o => String(o.created_at || '').startsWith(today)).length

  const recentProducts = [...products].sort((a, b) => (b.created_at || 0) - (a.created_at || 0)).slice(0, 5)
  const topDownloads = [...products].sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5)
  const revenueDays = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    const key = dayKey(date)
    const dayOrders = paidOrders.filter(o => o.created_at && dayKey(o.paid_at || o.created_at) === key)
    return {
      key,
      fullLabel: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' }),
      total: dayOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0),
      count: dayOrders.length,
    }
  })
  const chartDays = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (13 - i))
    const key = dayKey(date)
    return {
      key,
      label: date.toLocaleDateString('id-ID', { day: 'numeric', timeZone: 'Asia/Jakarta' }),
      fullLabel: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' }),
      views: eventsByDay[key]?.view || 0,
      clicks: eventsByDay[key]?.click || 0,
    }
  })
  const totalViews = chartDays.reduce((sum, day) => sum + day.views, 0)
  const totalClicks = chartDays.reduce((sum, day) => sum + day.clicks, 0)
  const maxChartValue = Math.max(1, ...chartDays.map(day => Math.max(day.views, day.clicks)))

  const summaryCards = [
    {
      title: 'Total Produk Aktif',
      value: activeProducts.length,
      icon: 'package',
      color: 'from-[#0ea5a0] to-[#0d7a8a]',
      bg: 'bg-[#0ea5a0]/5',
    },
    {
      title: 'Total Download',
      value: totalDownloads.toLocaleString(),
      icon: 'download',
      color: 'from-[#8b5cf6] to-[#7c3aed]',
      bg: 'bg-[#8b5cf6]/5',
    },
    {
      title: 'Pemasukan Bulan Ini',
      value: formatRupiah(monthlyRevenue),
      icon: 'currency',
      color: 'from-[#10b981] to-[#059669]',
      bg: 'bg-[#10b981]/5',
    },
    {
      title: 'Pesanan Hari Ini',
      value: dailyOrders,
      icon: 'shopping-cart',
      color: 'from-[#f59e0b] to-[#d97706]',
      bg: 'bg-[#f59e0b]/5',
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-2xl font-extrabold text-slate-700">Home</h1>
        <Link href="/admin/produk/baru" className="rounded-xl border border-[#25bd83] bg-white px-4 py-2 text-sm font-bold text-[#10946b] shadow-sm transition-transform active:scale-[0.96]">+ Produk</Link>
      </div>
      <section className="grid gap-3 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-100/80">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Account</span>
            <Link href="/" target="_blank" aria-label="Buka website" className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#10946b]">Share</Link>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#effbf6] p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#b8efcf] text-sm font-extrabold text-[#168f68]">BGY</div>
            <div className="min-w-0">
              <p className="font-bold text-slate-700">Bantu Guru Yuk</p>
              <p className="truncate text-xs text-[#18a873]">bgy-store.vercel.app</p>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-slate-500">Mulai kelola toko</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            <Link href="/admin/produk/baru" className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">Add Product</Link>
            <Link href="/admin/halaman/baru" className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">Add Page</Link>
            <Link href="/admin/homepage" className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">Appearance</Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#25bd83] via-[#43cfa0] to-[#65ddb8] p-5 text-white shadow-sm">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/12" />
          <div className="absolute -bottom-10 left-20 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-900/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/20">
              <svg className="h-10 w-10 text-emerald-100 drop-shadow" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path d="M24 4 40 14v20L24 44 8 34V14L24 4Z" fill="currentColor" opacity=".38" />
                <path d="M24 9 35 16 24 39 13 16 24 9Z" fill="#0f8f68" />
                <path d="M13 16h22L24 39 13 16Z" fill="#b7f5db" opacity=".82" />
                <path d="M24 9v30M13 16l11-7 11 7" stroke="white" strokeOpacity=".55" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">Earnings</p>
              <p className="mt-3 text-2xl font-extrabold">{formatRupiah(monthlyRevenue)}</p>
              <p className="mt-1 text-sm text-white/80">Payout Setting Page</p>
            </div>
            <Link href="/admin/pesanan" className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/18 text-xl font-bold text-white shadow-sm" aria-label="Lihat pesanan">↗</Link>
          </div>
          <div className="relative mt-5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#10946b]">{paidOrders.length} transaksi lunas tercatat</div>
        </div>
      </section>

      <RevenueChart days={revenueDays} />

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-700">Total Views & Clicks</h2>
            <div className="mt-2 flex gap-5 text-xs text-slate-500">
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />Views <b className="ml-1 text-base text-slate-700">{totalViews}</b></span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />Clicks <b className="ml-1 text-base text-slate-700">{totalClicks}</b></span>
            </div>
          </div>
          <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">14 hari</span>
        </div>
        <div className="mt-5 flex h-40 items-end gap-1 px-1">
          {chartDays.map((day) => (
            <div key={day.key} title={`${day.fullLabel}: ${day.views} views, ${day.clicks} clicks`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <div className="flex h-32 w-full items-end justify-center gap-0.5">
                <span className="w-1.5 rounded-t bg-amber-300" style={{ height: `${Math.max(3, (day.views / maxChartValue) * 100)}%` }} />
                <span className="w-1.5 rounded-t bg-emerald-400" style={{ height: `${Math.max(3, (day.clicks / maxChartValue) * 100)}%` }} />
              </div>
              <span className="text-[10px] text-slate-400">{day.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map(card => (
          <div key={card.title} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r ${card.color} text-white shadow-sm`}>
                <Icon name={card.icon} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-gray-500">{card.title}</p>
                <p className="text-base font-bold text-gray-900">{card.value}</p>
              </div>
          </div>
        ))}
      </div>

      {/* Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pesanan Terbaru */}
        <div className="bg-white/90 rounded-2xl shadow-card p-5 ring-1 ring-white/70">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Pesanan Terbaru</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order, i) => (
              <div key={order.id || i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0ea5a0]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#0ea5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.buyer_name || order.customer_name || 'Pembeli'}</p>
                    <p className="text-xs text-gray-400">{order.product_title || 'Produk digital'}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{order.status || 'pending'}</span>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">Belum ada pesanan.</p>
            )}
          </div>
        </div>

        {/* Produk dengan Download Terbanyak */}
        <div className="bg-white/90 rounded-2xl shadow-card p-5 ring-1 ring-white/70">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Produk Paling Banyak Diunduh</h3>
          <div className="space-y-3">
            {topDownloads.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                    <p className="text-xs text-gray-400">{product.category?.name || '-'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[#0ea5a0]">{product.download_count}</p>
                  <p className="text-xs text-gray-400">download</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Icon({ name }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {name === 'package' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
      {name === 'download' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
      {name === 'currency' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
      {name === 'shopping-cart' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />}
    </svg>
  )
}
