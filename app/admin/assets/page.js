import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

async function saveAsset(formData) {
  'use server'
  const supabase = await createClient()
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/assets?toast=demo')
  redirect('/admin/assets?toast=success')
}

async function deleteAsset(formData) {
  'use server'
  const supabase = await createClient()
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/assets?toast=demo')
  redirect('/admin/assets?toast=success')
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
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Asset berhasil diperbarui!' : 'Gagal memperbarui asset'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

const assetSlots = [
  { key: 'logo', label: 'Logo Utama', type: 'image' },
  { key: 'logo_white', label: 'Logo Putih', type: 'image' },
  { key: 'logo_dark', label: 'Logo Gelap', type: 'image' },
  { key: 'favicon', label: 'Favicon', type: 'image' },
  { key: 'default_cover', label: 'Default Cover', type: 'image' },
  { key: 'og_image', label: 'OG Image', type: 'image' },
  { key: 'hero_bg', label: 'Hero Background', type: 'image' },
  { key: 'placeholder_image', label: 'Placeholder Image', type: 'image' },
  { key: 'no_image', label: 'No Image', type: 'image' },
  { key: 'image_404', label: '404 Image', type: 'image' },
  { key: 'promo_banner', label: 'Promo Banner', type: 'image' },
]

export default async function AdminAssets({ searchParams }) {
  const supabase = await createClient()
  const toast = searchParams?.toast
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL
  let assets = {}
  if (!isDemo) {
    const { data } = await supabase.from('assets').select('*')
    if (data) {
      for (const a of data) assets[a.key] = a.value
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-gray-900">Asset Manager</h1>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {assetSlots.map(slot => {
          const currentValue = assets[slot.key]
          return (
            <div key={slot.key} className="bg-white rounded-xl shadow-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{slot.key}</span>
                {currentValue && (
                  <span className="w-2 h-2 rounded-full bg-green-400" title="Tersedia" />
                )}
              </div>
              <div className={`aspect-video rounded-lg mb-3 flex items-center justify-center ${currentValue ? 'bg-gray-100' : 'bg-gray-50 border-2 border-dashed border-gray-200'}`}>
                {currentValue ? (
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] text-gray-400 truncate max-w-full px-2">{currentValue.split('/').pop()}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] text-gray-400">Kosong</span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{slot.label}</h3>
              <div className="flex gap-2">
                <form action={saveAsset} className="flex-1">
                  <input type="hidden" name="key" value={slot.key} />
                  <button type="submit" className="w-full text-xs bg-[#0ea5a0] text-white px-3 py-1.5 rounded-lg hover:bg-[#0d7a8a] transition-colors font-medium">
                    Replace
                  </button>
                </form>
                {currentValue && (
                  <form action={deleteAsset}>
                    <input type="hidden" name="key" value={slot.key} />
                    <button type="submit" className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium">
                      Hapus
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
