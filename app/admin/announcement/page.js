import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoSettings } from '@/lib/demo-data'

async function saveAnnouncement(formData) {
  'use server'
  const raw = Object.fromEntries(formData)
  const supabase = await createClient()
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/announcement?toast=demo')
  const configs = [
    { key: 'announcement_active', value: raw.active === 'true' ? 'true' : 'false' },
    { key: 'announcement_text', value: raw.text || '' },
    { key: 'announcement_url', value: raw.url || '' },
    { key: 'announcement_bg_color', value: raw.bg_color || '#0ea5a0' },
    { key: 'announcement_text_color', value: raw.text_color || '#ffffff' },
    { key: 'announcement_start_date', value: raw.start_date || '' },
    { key: 'announcement_end_date', value: raw.end_date || '' },
  ]
  for (const { key, value } of configs) {
    const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    if (error) redirect('/admin/announcement?toast=error')
  }
  redirect('/admin/announcement?toast=success')
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
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Pengumuman berhasil disimpan!' : 'Gagal menyimpan pengumuman'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

export default async function AdminAnnouncement({ searchParams }) {
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
  let supabase
  if (!isDemo) {
    supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')
  } else {
    supabase = await createClient()
  }
  const toast = searchParams?.toast
  let settings = {}
  if (!isDemo) {
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      for (const s of data) settings[s.key] = s.value
    }
  }
  if (!settings.announcement_text) settings = demoSettings
  const active = settings.announcement_active !== 'false'
  const text = settings.announcement_text || ''
  const url = settings.announcement_url || ''
  const bgColor = settings.announcement_bg_color || '#0ea5a0'
  const textColor = settings.announcement_text_color || '#ffffff'
  const startDate = settings.announcement_start_date || ''
  const endDate = settings.announcement_end_date || ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-gray-900">Announcement Bar</h1>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form action={saveAnnouncement} className="space-y-6">
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Status</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="hidden" name="active" value="false" />
                <input type="checkbox" name="active" value="true" defaultChecked={active} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0ea5a0]" />
                <span className="ml-3 text-sm text-gray-600">{active ? 'Aktif' : 'Tidak Aktif'}</span>
              </label>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Konten</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Teks Pengumuman</label>
              <input name="text" defaultValue={text} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">URL (opsional)</label>
              <input name="url" defaultValue={url} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" placeholder="/free" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Tampilan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Warna Background</label>
                <div className="flex items-center gap-3">
                  <input type="color" name="bg_color" defaultValue={bgColor} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <span className="text-sm text-gray-500 font-mono">{bgColor}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Warna Teks</label>
                <div className="flex items-center gap-3">
                  <input type="color" name="text_color" defaultValue={textColor} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <span className="text-sm text-gray-500 font-mono">{textColor}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Jadwal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tanggal Mulai</label>
                <input type="date" name="start_date" defaultValue={startDate} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tanggal Berakhir</label>
                <input type="date" name="end_date" defaultValue={endDate} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
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
            <h2 className="text-sm font-bold text-gray-900 mb-4">Preview</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div
                className="px-4 py-3 text-center text-sm flex items-center justify-center gap-2 flex-wrap"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <span>{text || 'Teks pengumuman akan tampil di sini'}</span>
                {url && <span className="underline text-xs">Lihat</span>}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Tampilan announcement bar di halaman publik</p>
          </div>
        </div>
      </div>
    </div>
  )
}
