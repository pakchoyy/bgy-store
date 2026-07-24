import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'
import { demoProducts } from '@/lib/demo-data'

async function getDashboardData() {
  try {
    const supabase = await createClient()
    const { data: products } = await supabase.from('products').select('*')
    if (products) return products
  } catch {}
  return demoProducts
}

export default async function AdminDashboard() {
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
  if (!isDemo) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')
  }

  const products = await getDashboardData()

  const activeProducts = products.filter(p => p.is_active)
  const totalDownloads = products.reduce((sum, p) => sum + (p.download_count || 0), 0)
  const monthlyRevenue = products
    .filter(p => p.type === 'paid')
    .reduce((sum, p) => sum + (p.sale_price || 0), 0)
  const dailyOrders = 12

  const recentProducts = [...products].sort((a, b) => (b.created_at || 0) - (a.created_at || 0)).slice(0, 5)
  const topDownloads = [...products].sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5)

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

  const quickActions = [
    { label: '+ Tambah Produk', href: '/admin/produk/baru', color: 'bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white' },
    { label: '+ Tambah Halaman', href: '/admin/halaman/baru', color: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' },
    { label: 'Lihat Pesanan', href: '/admin/pesanan', color: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' },
    { label: 'Buka Website', href: '/', color: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <div key={card.title} className="bg-white rounded-xl shadow-card p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 -translate-y-6 translate-x-6 rounded-full ${card.bg}`} />
            <div className="relative">
              <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-r ${card.color} text-white shadow-sm mb-3`}>
                <Icon name={card.icon} />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{card.title}</p>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Aksi Cepat</h3>
        <div className="flex flex-wrap gap-2">
          {quickActions.map(action => (
            <Link
              key={action.label}
              href={action.href}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${action.color}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pesanan Terbaru */}
        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Pesanan Terbaru</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0ea5a0]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#0ea5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pembeli #{1000 + i}</p>
                    <p className="text-xs text-gray-400">{products[i - 1]?.title || `Produk #${i}`}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{i} jam lalu</span>
              </div>
            ))}
          </div>
        </div>

        {/* Produk dengan Download Terbanyak */}
        <div className="bg-white rounded-xl shadow-card p-5">
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
