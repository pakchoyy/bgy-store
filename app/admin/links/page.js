import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

async function saveLink(formData) {
  'use server'
  const raw = Object.fromEntries(formData)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/links?toast=demo')
  const payload = { key: raw.key, label: raw.label, url: raw.url }
  const { error } = raw.id
    ? await supabase.from('links').update(payload).eq('id', raw.id)
    : await supabase.from('links').insert(payload)
  if (error) redirect('/admin/links?toast=error')
  redirect('/admin/links?toast=success')
}

async function deleteLink(formData) {
  'use server'
  const id = formData.get('id')
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/links?toast=demo')
  const { error } = await supabase.from('links').delete().eq('id', id)
  if (error) redirect('/admin/links?toast=error')
  redirect('/admin/links?toast=success')
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
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Link berhasil disimpan!' : 'Gagal menyimpan link'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

const seedLinks = [
  { key: 'mayar', label: 'Mayar', url: 'https://mayar.id/bantuguruyuk' },
  { key: 'traktir_url', label: 'Traktir URL', url: 'https://trakteer.id/bantuguruyuk' },
  { key: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/6281234567890' },
  { key: 'tiktok', label: 'TikTok', url: 'https://tiktok.com/@bantuguruyuk' },
  { key: 'instagram', label: 'Instagram', url: 'https://instagram.com/bantuguruyuk' },
  { key: 'youtube', label: 'YouTube', url: 'https://youtube.com/@bantuguruyuk' },
  { key: 'telegram', label: 'Telegram', url: 'https://t.me/bantuguruyuk' },
  { key: 'shopee', label: 'Shopee', url: 'https://shopee.co.id/bantuguruyuk' },
  { key: 'tokopedia', label: 'Tokopedia', url: 'https://tokopedia.com/bantuguruyuk' },
  { key: 'google_drive', label: 'Google Drive', url: '#' },
]

export default async function AdminLinks({ searchParams }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const toast = searchParams?.toast
  const editId = searchParams?.edit
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL
  let links = []
  if (!isDemo) {
    const { data } = await supabase.from('links').select('*').order('key', { ascending: true })
    if (data && data.length > 0) links = data
  }
  if (links.length === 0) {
    links = seedLinks.map((s, i) => ({ id: `seed-${i}`, ...s }))
  }
  const editing = editId ? links.find(l => l.id === editId) : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-gray-900">Link Manager</h1>
        <details className="group relative">
          <summary className="list-none bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
            + Tambah Link
          </summary>
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-card border border-gray-100 p-4 z-50">
            <form action={saveLink} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Key</label>
                <input name="key" required className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 w-full text-sm font-mono" placeholder="my_link" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Label</label>
                <input name="label" required className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 w-full text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">URL</label>
                <input name="url" required className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 w-full text-sm" />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity">
                Simpan
              </button>
            </form>
          </div>
        </details>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Key</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Label</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">URL</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {links.map(link => (
                <tr key={link.id} className="hover:bg-gray-50/50">
                  {editing && editing.id === link.id ? (
                    <td colSpan={4} className="px-6 py-4">
                      <form action={saveLink} className="flex flex-wrap items-end gap-3">
                        <input type="hidden" name="id" value={link.id} />
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-xs font-medium text-gray-500 mb-0.5 block">Key</label>
                          <input name="key" defaultValue={link.key} className="border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 w-full text-sm font-mono" />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-xs font-medium text-gray-500 mb-0.5 block">Label</label>
                          <input name="label" defaultValue={link.label} className="border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 w-full text-sm" />
                        </div>
                        <div className="flex-[2] min-w-[180px]">
                          <label className="text-xs font-medium text-gray-500 mb-0.5 block">URL</label>
                          <input name="url" defaultValue={link.url} className="border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 w-full text-sm" />
                        </div>
                        <div className="flex gap-1">
                          <button type="submit" className="bg-[#0ea5a0] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#0d7a8a]">Simpan</button>
                          <a href="/admin/links" className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-200">Batal</a>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{link.key}</span>
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-900">{link.label}</td>
                      <td className="px-6 py-3">
                        <a href={link.url} target="_blank" className="text-xs text-[#0ea5a0] hover:underline truncate block max-w-[250px]">{link.url}</a>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`/admin/links?edit=${link.id}`} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">Edit</a>
                          <form action={deleteLink} className="inline">
                            <input type="hidden" name="id" value={link.id} />
                            <button type="submit" className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">Hapus</button>
                          </form>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
