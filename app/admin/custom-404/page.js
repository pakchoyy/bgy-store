import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoProducts } from '@/lib/demo-data'

async function saveCustom404(formData) {
  'use server'
  const raw = Object.fromEntries(formData)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/custom-404?toast=demo')
  const configs = [
    { key: 'custom_404_title', value: raw.title || '' },
    { key: 'custom_404_description', value: raw.description || '' },
    { key: 'custom_404_cta_text', value: raw.cta_text || '' },
    { key: 'custom_404_cta_url', value: raw.cta_url || '' },
    { key: 'custom_404_product_ids', value: raw.product_ids || '' },
  ]
  for (const { key, value } of configs) {
    const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    if (error) redirect('/admin/custom-404?toast=error')
  }
  redirect('/admin/custom-404?toast=success')
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
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Halaman 404 berhasil disimpan!' : 'Gagal menyimpan halaman 404'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

export default async function AdminCustom404({ searchParams }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const toast = searchParams?.toast
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL
  let settings = {}
  if (!isDemo) {
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      for (const s of data) settings[s.key] = s.value
    }
  }
  const title = settings.custom_404_title || 'Halaman Tidak Ditemukan'
  const description = settings.custom_404_description || 'Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.'
  const ctaText = settings.custom_404_cta_text || 'Kembali ke Beranda'
  const ctaUrl = settings.custom_404_cta_url || '/'
  const selectedIds = (settings.custom_404_product_ids || '').split(',').filter(Boolean)

  let products = []
  if (!isDemo) {
    const { data } = await supabase.from('products').select('id, title').eq('is_active', true).limit(10)
    if (data) products = data
  }
  if (products.length === 0) {
    products = demoProducts.filter(p => p.is_active).map(p => ({ id: p.id, title: p.title }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-gray-900">Custom 404 Manager</h1>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form action={saveCustom404} className="space-y-6">
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Konten Halaman 404</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
              <input name="title" defaultValue={title} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Deskripsi</label>
              <textarea name="description" rows={3} defaultValue={description} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm resize-y" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">CTA Text</label>
              <input name="cta_text" defaultValue={ctaText} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">CTA URL</label>
              <input name="cta_url" defaultValue={ctaUrl} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Rekomendasi Produk</h2>
            <p className="text-xs text-gray-400">Pilih produk yang akan ditampilkan sebagai rekomendasi di halaman 404</p>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {products.map(product => {
                const checked = selectedIds.includes(product.id)
                return (
                  <label key={product.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="product_ids"
                      value={product.id}
                      defaultChecked={checked}
                      className="text-[#0ea5a0] focus:ring-[#0ea5a0] rounded"
                    />
                    <span className="text-sm text-gray-700">{product.title}</span>
                  </label>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
              Simpan
            </button>
          </div>
        </form>
        <div>
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Preview Halaman 404</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-8 text-center bg-gray-50">
                <div className="text-6xl font-extrabold text-gray-200 mb-2">404</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">{description}</p>
                <div className="inline-block bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-5 py-2.5 rounded-lg">
                  {ctaText}
                </div>
              </div>
              {selectedIds.length > 0 && (
                <div className="p-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">Rekomendasi Produk:</p>
                  <div className="flex flex-wrap gap-2">
                    {products.filter(p => selectedIds.includes(p.id)).slice(0, 3).map(p => (
                      <div key={p.id} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{p.title}</div>
                    ))}
                    {selectedIds.length > 3 && (
                      <div className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full">+{selectedIds.length - 3} lainnya</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
