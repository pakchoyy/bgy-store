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
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white/90">Earnings</p>
              <p className="mt-3 text-2xl font-extrabold">{formatRupiah(monthlyRevenue)}</p>
              <p className="mt-1 text-sm text-white/80">Payout Setting Page</p>
            </div>
            <Link href="/admin/pesanan" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/18 text-xl font-bold text-white shadow-sm" aria-label="Lihat pesanan">↗</Link>
          </div>
          <div className="relative mt-5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#10946b]">Verify your account to activate</div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-700">Total Views & Clicks</h2><div className="mt-2 flex gap-5 text-xs text-slate-500"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />Views <b className="ml-1 text-base text-slate-700">303</b></span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />Clicks <b className="ml-1 text-base text-slate-700">198</b></span></div></div><span className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">Pilih tanggal</span></div>
        <div className="mt-5 flex h-36 items-end gap-2 overflow-hidden px-2">{[34,18,10,25,46,28,62,20,36,24,72,40,30,52,25,44,34,58,32,47].map((h, i) => <div key={i} className="flex min-w-2 flex-1 items-end gap-0.5"><span className="w-1/2 rounded-t bg-amber-300" style={{height:`${h}%`}} /><span className="w-1/2 rounded-t bg-emerald-400" style={{height:`${Math.max(10,h-22)}%`}} /></div>)}</div>
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
