import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoFooterConfig, demoFooterLinks } from '@/lib/demo-data'

async function saveFooter(formData) {
  'use server'
  const raw = Object.fromEntries(formData)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/footer?toast=demo')
  const configEntries = [
    { key: 'copyright_text', value: raw.copyright_text },
    { key: 'description', value: raw.description },
    { key: 'email', value: raw.email },
    { key: 'whatsapp', value: raw.whatsapp },
    { key: 'alamat', value: raw.alamat },
    { key: 'show_social_links', value: raw.show_social_links || 'false' },
  ]
  for (const entry of configEntries) {
    const { error } = await supabase.from('footer_config').upsert(entry, { onConflict: 'key' })
    if (error) redirect('/admin/footer?toast=error')
  }
  redirect('/admin/footer?toast=success')
}

async function saveLink(formData) {
  'use server'
  const raw = Object.fromEntries(formData)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/footer?toast=demo')
  const payload = { label: raw.label, url: raw.url, sort_order: parseInt(raw.sort_order) || 1, is_visible: true }
  const { error } = raw.id
    ? await supabase.from('footer_links').update(payload).eq('id', raw.id)
    : await supabase.from('footer_links').insert(payload)
  if (error) redirect('/admin/footer?toast=error')
  redirect('/admin/footer?toast=success')
}

async function deleteLink(formData) {
  'use server'
  const id = formData.get('id')
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/footer?toast=demo')
  const { error } = await supabase.from('footer_links').delete().eq('id', id)
  if (error) redirect('/admin/footer?toast=error')
  redirect('/admin/footer?toast=success')
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
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Footer berhasil disimpan!' : 'Gagal menyimpan footer'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

function getConfig(configs, key, fallback) {
  const found = configs.find(c => c.key === key)
  return found ? found.value : fallback
}

export default async function AdminFooter({ searchParams }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const toast = searchParams?.toast
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL
  let configs = []
  let links = []
  if (!isDemo) {
    const { data: c } = await supabase.from('footer_config').select('*')
    if (c) configs = c
    const { data: l } = await supabase.from('footer_links').select('*').order('sort_order', { ascending: true })
    if (l) links = l
  }
  if (configs.length === 0) configs = demoFooterConfig
  if (links.length === 0) links = demoFooterLinks
  const copyright = getConfig(configs, 'copyright_text', '© 2026 Bantu Guru Yuk. All rights reserved.')
  const desc = getConfig(configs, 'description', '')
  const email = getConfig(configs, 'email', '')
  const whatsapp = getConfig(configs, 'whatsapp', '')
  const alamat = getConfig(configs, 'alamat', '')
  const showSocial = getConfig(configs, 'show_social_links', 'true') === 'true'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-gray-900">Footer Manager</h1>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <form action={saveFooter} className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Pengaturan Footer</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Copyright Text</label>
              <input name="copyright_text" defaultValue={copyright} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Deskripsi</label>
              <textarea name="description" rows={3} defaultValue={desc} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm resize-y" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input name="email" type="email" defaultValue={email} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">WhatsApp</label>
              <input name="whatsapp" defaultValue={whatsapp} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Alamat</label>
              <input name="alamat" defaultValue={alamat} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="hidden" name="show_social_links" value="false" />
                <input type="checkbox" name="show_social_links" value="true" defaultChecked={showSocial} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0ea5a0]" />
                <span className="ml-3 text-sm text-gray-600">Tampilkan Sosial Media</span>
              </label>
            </div>
            <button type="submit" className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Simpan Pengaturan
            </button>
          </form>
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Link Tambahan</h2>
              <details className="group relative">
                <summary className="list-none text-sm font-semibold text-[#0ea5a0] hover:text-[#0d7a8a] cursor-pointer">
                  + Tambah Link
                </summary>
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-card border border-gray-100 p-4 z-50">
                  <form action={saveLink} className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Label</label>
                      <input name="label" required className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 w-full text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">URL</label>
                      <input name="url" defaultValue="/" className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 w-full text-sm" />
                    </div>
                    <input type="hidden" name="sort_order" value={links.length + 1} />
                    <button type="submit" className="w-full bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity">
                      Simpan
                    </button>
                  </form>
                </div>
              </details>
            </div>
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={link.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{link.label}</span>
                    <span className="text-xs text-gray-400 block truncate">{link.url}</span>
                  </div>
                  <form action={deleteLink}>
                    <input type="hidden" name="id" value={link.id} />
                    <button type="submit" className="text-red-500 hover:text-red-700 p-1" title="Hapus">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Preview Footer</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-900 text-gray-300 p-4 text-xs space-y-3">
                <div className="flex flex-wrap gap-3">
                  {links.slice(0, 4).map(l => (
                    <span key={l.id} className="text-white text-xs hover:text-[#0ea5a0] cursor-pointer">{l.label}</span>
                  ))}
                </div>
                <div className="text-xs text-gray-400">{desc || 'Deskripsi footer akan tampil di sini'}</div>
                {showSocial && (
                  <div className="flex gap-2">
                    {['Wa', 'Ig', 'Tk'].map(s => (
                      <div key={s} className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[9px] text-white">{s}</div>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">{copyright}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
