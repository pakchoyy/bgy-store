import { createClient } from '@/lib/supabase-server'
import { formatRupiah } from '@/lib/utils'

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

async function getData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') return null

  try {
    const supabase = await createClient()
    const { data: orders } = await supabase
      .from('orders')
      .select('id, product_id, amount, status, created_at')

    const paidOrders = (orders || []).filter(o => o.status === 'paid')
    const pendingOrders = (orders || []).filter(o => o.status === 'pending')
    const revenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0)

    const salesByProduct = {}
    for (const o of paidOrders) {
      if (!o.product_id) continue
      salesByProduct[o.product_id] = (salesByProduct[o.product_id] || 0) + 1
    }
    const topProductIds = Object.entries(salesByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    let topProducts = []
    if (topProductIds.length) {
      const { data: products } = await supabase.from('products').select('id, title').in('id', topProductIds)
      topProducts = topProductIds.map(id => ({
        title: products?.find(p => p.id === id)?.title || 'Produk',
        sales: salesByProduct[id],
      }))
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentPaid = paidOrders.filter(o => new Date(o.created_at) >= thirtyDaysAgo)
    const recentRevenue = recentPaid.reduce((sum, o) => sum + (o.amount || 0), 0)

    return {
      revenue,
      totalOrders: orders?.length || 0,
      paidCount: paidOrders.length,
      pendingCount: pendingOrders.length,
      recentRevenue,
      recentCount: recentPaid.length,
      topProducts,
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
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan performa penjualan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatRupiah(stats.revenue)} sub={`${stats.paidCount} pesanan lunas`} />
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
    </div>
  )
}
