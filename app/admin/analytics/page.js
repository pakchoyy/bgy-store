import { createClient } from '@/lib/supabase-server'
import { formatRupiah } from '@/lib/utils'

function StatCard({ label, value, sub }) {
  return (
    <div className="min-w-0 bg-white rounded-xl shadow-card p-4">
      <p className="text-[11px] font-semibold text-gray-500 uppercase">{label}</p>
      <p className="mt-1 truncate text-xl font-extrabold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function RankList({ title, items, empty, unit }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <h2 className="text-sm font-bold text-gray-900 mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">{empty}</p>
      ) : (
        <ol className="space-y-1">
          {items.map((item, i) => (
            <li key={item.label} className="flex items-center justify-between gap-3 border-b border-gray-50 py-2 last:border-0">
              <span className="min-w-0 truncate text-sm text-gray-700">{i + 1}. {item.label}</span>
              <span className="shrink-0 text-sm font-semibold text-gray-900">{item.count} {unit}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

async function getData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') return null

  try {
    const supabase = await createClient()
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const [{ data: orders }, { data: events }, { data: allProducts }] = await Promise.all([
      supabase.from('orders').select('id, product_id, amount, status, created_at'),
      supabase.from('analytics_events').select('event_type, path, product_id').gte('created_at', since).limit(50000),
      supabase.from('products').select('id, title'),
    ])
    const titleOf = (id) => allProducts?.find(p => p.id === id)?.title || 'Produk dihapus'

    const paidOrders = (orders || []).filter(o => o.status === 'paid')
    const pendingOrders = (orders || []).filter(o => o.status === 'pending')
    const revenue = paidOrders.filter(o => o.product_id).reduce((sum, o) => sum + (o.amount || 0), 0)
    const tipOrders = paidOrders.filter(o => !o.product_id)
    const tipTotal = tipOrders.reduce((sum, o) => sum + (o.amount || 0), 0)

    const views = (events || []).filter(e => e.event_type === 'view')
    const clicks = (events || []).filter(e => e.event_type === 'click')
    const countBy = (list, key) => {
      const map = {}
      for (const item of list) {
        const value = item[key]
        if (value) map[value] = (map[value] || 0) + 1
      }
      return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
    }
    const topPages = countBy(views, 'path').map(([path, count]) => ({ label: path, count }))
    const topClicked = countBy(clicks, 'product_id').map(([id, count]) => ({ label: titleOf(id), count }))

    const salesByProduct = {}
    for (const o of paidOrders) {
      if (!o.product_id) continue
      salesByProduct[o.product_id] = (salesByProduct[o.product_id] || 0) + 1
    }
    const topProductIds = Object.entries(salesByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    const topProducts = topProductIds.map(id => ({ title: titleOf(id), sales: salesByProduct[id] }))

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentPaid = paidOrders.filter(o => new Date(o.created_at) >= thirtyDaysAgo)
    const recentRevenue = recentPaid.filter(o => o.product_id).reduce((sum, o) => sum + (o.amount || 0), 0)

    return {
      revenue,
      totalOrders: orders?.length || 0,
      paidCount: paidOrders.length,
      pendingCount: pendingOrders.length,
      recentRevenue,
      recentCount: recentPaid.length,
      topProducts,
      tipTotal,
      tipCount: tipOrders.length,
      views: views.length,
      clicks: clicks.length,
      clickRate: views.length ? Math.round((clicks.length / views.length) * 100) : 0,
      topPages,
      topClicked,
    }
  } catch {
    return null
  }
}

export default async function AdminAnalytics() {
  const stats = await getData()

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Analytics</h1>
        </div>
        <div className="bg-white rounded-xl shadow-card p-12 text-center text-sm text-gray-400">
          Hubungkan Supabase untuk melihat analitik penjualan.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan pengunjung dan penjualan</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Views 30 Hari" value={stats.views.toLocaleString('id-ID')} sub="halaman dibuka" />
        <StatCard label="Clicks 30 Hari" value={stats.clicks.toLocaleString('id-ID')} sub="klik produk & tombol" />
        <StatCard label="Click Rate" value={`${stats.clickRate}%`} sub="clicks ÷ views" />
        <StatCard label="Traktir Kopi" value={formatRupiah(stats.tipTotal)} sub={`${stats.tipCount} traktiran`} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Revenue Produk" value={formatRupiah(stats.revenue)} sub={`${stats.paidCount} pesanan lunas`} />
        <StatCard label="Revenue 30 Hari" value={formatRupiah(stats.recentRevenue)} sub={`${stats.recentCount} pesanan`} />
        <StatCard label="Total Pesanan" value={stats.totalOrders} />
        <StatCard label="Pending" value={stats.pendingCount} sub="belum dibayar" />
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Produk Terlaris</h2>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada penjualan produk berbayar.</p>
        ) : (
          <div className="space-y-2">
            {stats.topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{i + 1}. {p.title}</span>
                <span className="text-sm font-semibold text-gray-900">{p.sales} terjual</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <RankList title="Produk Paling Banyak Diklik" items={stats.topClicked} empty="Belum ada klik tercatat." unit="klik" />
        <RankList title="Halaman Terpopuler" items={stats.topPages} empty="Belum ada kunjungan tercatat." unit="views" />
      </div>
    </div>
  )
}
