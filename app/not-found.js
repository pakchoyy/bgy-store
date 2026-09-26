import Link from 'next/link'
import ProductStack from '@/components/public/ProductStack'
import { fetchStoreShell, hasSupabase } from '@/lib/store-shell'
import { settingsToMap } from '@/lib/utils'

async function getNotFoundData() {
  if (!hasSupabase()) return { settings: {}, products: [] }
  try {
    const { createClient } = await import('@/lib/supabase-server')
    const supabase = await createClient()
    const [{ data: rows }, shell] = await Promise.all([
      supabase.from('settings').select('key,value').like('key', 'custom_404_%'),
      fetchStoreShell(),
    ])
    const settings = settingsToMap(rows || [])
    const ids = String(settings.custom_404_product_ids || '').split(',').filter(Boolean)
    const products = (shell.products || []).filter((p) => ids.includes(p.id)).slice(0, 3)
    return { settings, products }
  } catch {
    return { settings: {}, products: [] }
  }
}

function safeHref(url) {
  const value = String(url || '').trim()
  return value.startsWith('/') || value.startsWith('https://') ? value : '/'
}

export default async function NotFound() {
  const { settings, products } = await getNotFoundData()
  const title = settings.custom_404_title || 'Halaman Tidak Ditemukan'
  const description = settings.custom_404_description || 'Maaf, halaman yang kamu cari tidak tersedia atau sudah dipindahkan.'
  const ctaText = settings.custom_404_cta_text || 'Kembali ke Beranda'
  const ctaUrl = safeHref(settings.custom_404_cta_url || '/')

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0ea5a0] via-[#5cc9bf] to-[#f0fdfa] px-4 py-12">
      <div className="mx-auto max-w-md space-y-4">
        <section className="rounded-2xl bg-white/95 p-6 text-center shadow-sm">
          <p className="font-numeric text-5xl font-bold tracking-tight text-[#0ea5a0]" aria-hidden="true">404</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
          <div className="mt-5 grid gap-2">
            <Link href={ctaUrl} className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-[background-color,transform] duration-150 hover:bg-emerald-600 active:scale-[0.97]">
              {ctaText}
            </Link>
            <Link href="/produk" className="flex min-h-11 items-center justify-center rounded-xl border border-[#0ea5a0] px-5 text-sm font-semibold text-[#0d7a8a] transition-colors hover:bg-teal-50">
              Lihat Produk
            </Link>
          </div>
        </section>
        {products.length > 0 && (
          <section aria-labelledby="nf-products">
            <h2 id="nf-products" className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-white">Mungkin kamu cari ini</h2>
            <ProductStack products={products} animate={false} />
          </section>
        )}
      </div>
    </main>
  )
}
