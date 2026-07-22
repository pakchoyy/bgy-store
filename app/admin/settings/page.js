import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoSettings } from '@/lib/demo-data'

async function saveSettings(formData) {
  'use server'
  const raw = Object.fromEntries(formData)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect(`/admin/settings?tab=${raw._tab || 'umum'}&toast=demo`)
  const keys = Object.keys(raw).filter(k => k !== '_tab')
  for (const key of keys) {
    const { error } = await supabase.from('settings').upsert({ key, value: raw[key] }, { onConflict: 'key' })
    if (error) redirect(`/admin/settings?tab=${raw._tab || 'umum'}&toast=error`)
  }
  redirect(`/admin/settings?tab=${raw._tab || 'umum'}&toast=success`)
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
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Pengaturan berhasil disimpan!' : 'Gagal menyimpan pengaturan'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

export default async function AdminSettings({ searchParams }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const toast = searchParams?.toast
  const activeTab = searchParams?.tab || 'umum'
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL
  let settings = {}
  if (!isDemo) {
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      for (const s of data) settings[s.key] = s.value
    }
  }
  if (!settings.site_name) settings = { ...demoSettings, ...settings }

  const tabs = [
    { id: 'umum', label: 'Umum' },
    { id: 'download', label: 'Download' },
    { id: 'maintenance', label: 'Maintenance' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-gray-900">Pengaturan Website</h1>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(tab => (
          <a
            key={tab.id}
            href={`/admin/settings?tab=${tab.id}`}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </a>
        ))}
      </div>
      {activeTab === 'umum' && (
        <form action={saveSettings} className="max-w-2xl space-y-6">
          <input type="hidden" name="_tab" value="umum" />
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nama Website</label>
              <input name="site_name" defaultValue={settings.site_name || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tagline</label>
              <input name="site_tagline" defaultValue={settings.site_tagline || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
              Simpan
            </button>
          </div>
        </form>
      )}
      {activeTab === 'download' && (
        <form action={saveSettings} className="max-w-2xl space-y-6">
          <input type="hidden" name="_tab" value="download" />
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Traktir URL</label>
              <input name="traktir_url" defaultValue={settings.traktir_url || settings.announcement_url || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Promo Text</label>
              <input name="promo_text" defaultValue={settings.promo_text || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Promo CTA Text</label>
              <input name="promo_cta_text" defaultValue={settings.promo_cta_text || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Promo CTA URL</label>
              <input name="promo_cta_url" defaultValue={settings.promo_cta_url || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Countdown Duration (detik)</label>
              <div className="flex items-center gap-3">
                <input type="range" name="countdown_duration" min="3" max="10" defaultValue={settings.countdown_duration || '5'} className="flex-1 accent-[#0ea5a0]" />
                <span className="text-sm font-medium text-gray-700 w-8 text-center">{settings.countdown_duration || '5'}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
              Simpan
            </button>
          </div>
        </form>
      )}
      {activeTab === 'maintenance' && (
        <form action={saveSettings} className="max-w-2xl space-y-6">
          <input type="hidden" name="_tab" value="maintenance" />
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Mode Maintenance</h2>
                <p className="text-xs text-gray-400">Aktifkan untuk menampilkan halaman maintenance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="hidden" name="maintenance_mode" value="false" />
                <input type="checkbox" name="maintenance_mode" value="true" defaultChecked={settings.maintenance_mode === 'true'} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0ea5a0]" />
              </label>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Pesan Maintenance</label>
              <textarea name="maintenance_message" rows={4} defaultValue={settings.maintenance_message || 'Kami sedang dalam perbaikan. Silakan kembali lagi nanti.'} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm resize-y" />
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
