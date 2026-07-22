import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoSettings } from '@/lib/demo-data'

async function saveTheme(formData) {
  'use server'
  const raw = Object.fromEntries(formData)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/theme?toast=demo')
  const configs = [
    { key: 'theme_primary_color', value: raw.primary_color },
    { key: 'theme_secondary_color', value: raw.secondary_color },
    { key: 'theme_border_radius', value: raw.border_radius },
    { key: 'theme_font', value: raw.font },
  ]
  for (const { key, value } of configs) {
    const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    if (error) redirect('/admin/theme?toast=error')
  }
  redirect('/admin/theme?toast=success')
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
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Tema berhasil disimpan!' : 'Gagal menyimpan tema'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

export default async function AdminTheme({ searchParams }) {
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
  if (!settings.theme_primary_color) settings = demoSettings
  const primary = settings.theme_primary_color || '#0ea5a0'
  const secondary = settings.theme_secondary_color || '#0d7a8a'
  const borderRadius = settings.theme_border_radius || 'rounded'
  const font = settings.theme_font || 'Poppins'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-gray-900">Theme Manager</h1>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <form action={saveTheme} className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Warna</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Primary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" name="primary_color" defaultValue={primary} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                <span className="text-sm text-gray-500 font-mono">{primary}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" name="secondary_color" defaultValue={secondary} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                <span className="text-sm text-gray-500 font-mono">{secondary}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Border Radius</h2>
          <div className="flex flex-wrap gap-4">
            {[
              { value: 'rounded', label: 'Rounded', class: 'rounded-full' },
              { value: 'slightly', label: 'Sedikit Rounded', class: 'rounded-lg' },
              { value: 'square', label: 'Kotak', class: 'rounded-none' },
            ].map(r => (
              <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="border_radius" value={r.value} defaultChecked={borderRadius === r.value} className="text-[#0ea5a0] focus:ring-[#0ea5a0]" />
                <div className={`w-8 h-8 border border-gray-300 ${r.class}`} />
                <span className="text-sm text-gray-600">{r.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Font</h2>
          <div className="flex flex-wrap gap-4">
            {['Poppins', 'Inter', 'Plus Jakarta Sans', 'Nunito'].map(f => (
              <label key={f} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${font === f ? 'border-[#0ea5a0] bg-[rgba(14,165,160,0.08)]' : 'border-gray-200 bg-gray-50'}`}>
                <input type="radio" name="font" value={f} defaultChecked={font === f} className="sr-only" />
                <span className="text-sm font-medium text-gray-700" style={{ fontFamily: f }}>{f}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Logo Preview</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#0ea5a0] rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold text-lg">BGY</span>
            </div>
            <div className="text-sm text-gray-500">
              <p>Logo saat ini: <strong>BGY</strong></p>
              <p className="text-xs">(Ganti logo di Asset Manager)</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
            Simpan
          </button>
        </div>
      </form>
    </div>
  )
}
