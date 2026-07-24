import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoSettings } from '@/lib/demo-data'

async function saveSEO(formData) {
  'use server'
  const raw = Object.fromEntries(formData)
  const supabase = await createClient()
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect(`/admin/seo?tab=${raw._tab || 'global'}&toast=demo`)
  const keys = Object.keys(raw).filter(k => k !== '_tab')
  for (const key of keys) {
    const { error } = await supabase.from('settings').upsert({ key, value: raw[key] }, { onConflict: 'key' })
    if (error) redirect(`/admin/seo?tab=${raw._tab || 'global'}&toast=error`)
  }
  redirect(`/admin/seo?tab=${raw._tab || 'global'}&toast=success`)
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
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Pengaturan SEO berhasil disimpan!' : 'Gagal menyimpan pengaturan SEO'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

export default async function AdminSEO({ searchParams }) {
  const supabase = await createClient()
  const toast = searchParams?.toast
  const activeTab = searchParams?.tab || 'global'
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL
  let settings = {}
  if (!isDemo) {
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      for (const s of data) settings[s.key] = s.value
    }
  }
  if (!settings.seo_meta_title) {
    settings = {
      seo_meta_title: 'Bantu Guru Yuk - Toko Digital untuk Guru SD',
      seo_meta_description: 'Download modul ajar, ATP, media pembelajaran, dan administrasi sekolah untuk guru SD Indonesia. Gratis dan berbayar.',
      seo_template_product: '{judul_produk} - {nama_website}',
      seo_template_category: 'Kategori {nama_kategori} - {nama_website}',
      seo_template_page: '{judul_halaman} - {nama_website}',
      seo_robots_index: 'true',
      seo_robots_follow: 'true',
      ...settings,
    }
  }

  const tabs = [
    { id: 'global', label: 'Global' },
    { id: 'template', label: 'Template' },
    { id: 'robots', label: 'Robots' },
  ]

  const metaDesc = settings.seo_meta_description || ''
  const metaTitle = settings.seo_meta_title || ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-gray-900">SEO Manager</h1>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(tab => (
          <a
            key={tab.id}
            href={`/admin/seo?tab=${tab.id}`}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </a>
        ))}
      </div>
      {activeTab === 'global' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form action={saveSEO} className="space-y-6">
            <input type="hidden" name="_tab" value="global" />
            <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Default Meta Title</label>
                <input name="seo_meta_title" defaultValue={metaTitle} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Default Meta Description</label>
                <textarea name="seo_meta_description" rows={4} defaultValue={metaDesc} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm resize-y" />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">Karaketer: {metaDesc.length}</span>
                  <span className={`text-[10px] ${metaDesc.length > 160 ? 'text-red-500' : 'text-green-500'}`}>
                    {metaDesc.length > 160 ? 'Terlalu panjang (>160)' : 'Optimal'}
                  </span>
                </div>
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
              <h2 className="text-sm font-bold text-gray-900 mb-4">SEO Preview</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-[#1a0dab] text-lg font-medium hover:underline cursor-pointer line-clamp-1">
                  {metaTitle || 'Judul halaman akan tampil di sini'}
                </div>
                <div className="text-[#006621] text-sm font-medium mt-0.5">
                  https://bantuguruyuk.web.id/
                </div>
                <div className="text-[#545454] text-sm mt-1 line-clamp-2">
                  {metaDesc || 'Deskripsi halaman akan tampil di sini...'}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Tampilan di hasil pencarian Google</p>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'template' && (
        <form action={saveSEO} className="max-w-2xl space-y-6">
          <input type="hidden" name="_tab" value="template" />
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Template Produk</label>
              <input name="seo_template_product" defaultValue={settings.seo_template_product || '{judul_produk} - {nama_website}'} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm font-mono" />
              <p className="text-[10px] text-gray-400 mt-1">Variabel: {`{judul_produk}`}, {`{nama_website}`}, {`{harga}`}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Template Kategori</label>
              <input name="seo_template_category" defaultValue={settings.seo_template_category || 'Kategori {nama_kategori} - {nama_website}'} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm font-mono" />
              <p className="text-[10px] text-gray-400 mt-1">Variabel: {`{nama_kategori}`}, {`{nama_website}`}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Template Halaman</label>
              <input name="seo_template_page" defaultValue={settings.seo_template_page || '{judul_halaman} - {nama_website}'} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm font-mono" />
              <p className="text-[10px] text-gray-400 mt-1">Variabel: {`{judul_halaman}`}, {`{nama_website}`}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
              Simpan
            </button>
          </div>
        </form>
      )}
      {activeTab === 'robots' && (
        <form action={saveSEO} className="max-w-2xl space-y-6">
          <input type="hidden" name="_tab" value="robots" />
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Robots Meta</h2>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Index</span>
                <p className="text-xs text-gray-400">Izinkan mesin pencari mengindeks halaman</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="hidden" name="seo_robots_index" value="false" />
                <input type="checkbox" name="seo_robots_index" value="true" defaultChecked={settings.seo_robots_index !== 'false'} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0ea5a0]" />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Follow</span>
                <p className="text-xs text-gray-400">Izinkan mesin pencari mengikuti tautan</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="hidden" name="seo_robots_follow" value="false" />
                <input type="checkbox" name="seo_robots_follow" value="true" defaultChecked={settings.seo_robots_follow !== 'false'} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0ea5a0]" />
              </label>
            </div>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
              <p className="font-medium text-gray-700 mb-1">Hasil:</p>
              <code className="block bg-white border border-gray-200 rounded px-2 py-1">
                {settings.seo_robots_index !== 'false' ? 'index' : 'noindex'}, {settings.seo_robots_follow !== 'false' ? 'follow' : 'nofollow'}
              </code>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
              Simpan
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
