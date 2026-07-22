import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoContacts } from '@/lib/demo-data'

async function saveContacts(formData) {
  'use server'
  const raw = Object.fromEntries(formData)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/contacts?toast=demo')
  const fields = ['whatsapp', 'email', 'tiktok', 'instagram', 'youtube', 'telegram']
  for (const key of fields) {
    if (raw[key] !== undefined) {
      const { error } = await supabase.from('contacts').upsert({ key, value: raw[key] }, { onConflict: 'key' })
      if (error) redirect('/admin/contacts?toast=error')
    }
  }
  redirect('/admin/contacts?toast=success')
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
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Kontak berhasil disimpan!' : 'Gagal menyimpan kontak'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

const contactFields = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', placeholder: '6281234567890' },
  { key: 'email', label: 'Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', placeholder: 'hello@example.com' },
  { key: 'tiktok', label: 'TikTok', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', placeholder: '@username' },
  { key: 'instagram', label: 'Instagram', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', placeholder: '@username' },
  { key: 'youtube', label: 'YouTube', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z', placeholder: 'URL channel YouTube' },
  { key: 'telegram', label: 'Telegram', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8', placeholder: '@username atau nomor' },
]

export default async function AdminContacts({ searchParams }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const toast = searchParams?.toast
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL
  let contacts = []
  if (!isDemo) {
    const { data } = await supabase.from('contacts').select('*')
    if (data && data.length > 0) contacts = data
  }
  if (contacts.length === 0) contacts = demoContacts
  const getValue = (key) => {
    const c = contacts.find(ct => ct.key === key)
    return c ? c.value : ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-gray-900">Contact Manager</h1>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <form action={saveContacts} className="max-w-2xl space-y-4">
        {contactFields.map(field => (
          <div key={field.key} className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[rgba(14,165,160,0.1)] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#0ea5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={field.icon} />
                </svg>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1 block">{field.label}</label>
                <input
                  name={field.key}
                  defaultValue={getValue(field.key)}
                  placeholder={field.placeholder}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm"
                />
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <button type="submit" className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
            Simpan Semua
          </button>
        </div>
      </form>
    </div>
  )
}
