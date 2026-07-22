import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoNavItems } from '@/lib/demo-data'

async function saveNav(formData) {
  'use server'
  const raw = Object.fromEntries(formData)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/navigation?toast=demo')
  const payload = {
    label: raw.label,
    target_type: raw.target_type || 'external',
    target_url: raw.target_url || '/',
    is_visible: raw.is_visible === 'true',
    sort_order: parseInt(raw.sort_order) || 1,
  }
  const { error } = raw.id
    ? await supabase.from('navigation_items').update(payload).eq('id', raw.id)
    : await supabase.from('navigation_items').insert(payload)
  if (error) redirect('/admin/navigation?toast=error')
  redirect('/admin/navigation?toast=success')
}

async function deleteNav(formData) {
  'use server'
  const id = formData.get('id')
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/navigation?toast=demo')
  const { error } = await supabase.from('navigation_items').delete().eq('id', id)
  if (error) redirect('/admin/navigation?toast=error')
  redirect('/admin/navigation?toast=success')
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
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Menu berhasil disimpan!' : 'Gagal menyimpan menu'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

function targetTypeLabel(type) {
  const map = { page: 'Halaman', product: 'Produk', category: 'Kategori', external: 'URL Eksternal' }
  return map[type] || type
}

export default async function AdminNavigation({ searchParams }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const toast = searchParams?.toast
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL
  let items = []
  if (!isDemo) {
    const { data } = await supabase.from('navigation_items').select('*').order('sort_order', { ascending: true })
    if (data) items = data
  }
  if (items.length === 0) items = demoNavItems

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-gray-900">Navigation Manager</h1>
        <details className="group relative">
          <summary className="list-none bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
            + Tambah Menu
          </summary>
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-card border border-gray-100 p-4 z-50">
            <form action={saveNav} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Label</label>
                <input name="label" required className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 w-full text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Target Type</label>
                <select name="target_type" className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm">
                  <option value="external">URL Eksternal</option>
                  <option value="page">Halaman</option>
                  <option value="product">Produk</option>
                  <option value="category">Kategori</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Target URL</label>
                <input name="target_url" defaultValue="/" className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 w-full text-sm" />
              </div>
              <input type="hidden" name="is_visible" value="true" />
              <input type="hidden" name="sort_order" value={items.length + 1} />
              <button type="submit" className="w-full bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity">
                Simpan
              </button>
            </form>
          </div>
        </details>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <div className="bg-white rounded-xl shadow-card">
        {items.map((item, i) => (
          <div key={item.id} className={`${i > 0 ? 'border-t border-gray-100' : ''}`}>
            <details className="group">
              <summary className="list-none cursor-pointer px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="text-gray-300 hover:text-gray-500 cursor-grab shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{targetTypeLabel(item.target_type)}</span>
                    </div>
                    <span className="text-xs text-gray-400 truncate block">{item.target_url}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${item.is_visible ? 'bg-green-400' : 'bg-gray-300'}`} title={item.is_visible ? 'Aktif' : 'Tidak Aktif'} />
                  <svg className="w-4 h-4 text-gray-300 group-open:rotate-180 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                <form action={saveNav} className="space-y-3">
                  <input type="hidden" name="id" value={item.id} />
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Label</label>
                    <input name="label" defaultValue={item.label} className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Target Type</label>
                    <select name="target_type" defaultValue={item.target_type} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm">
                      <option value="external">URL Eksternal</option>
                      <option value="page">Halaman</option>
                      <option value="product">Produk</option>
                      <option value="category">Kategori</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Target URL</label>
                    <input name="target_url" defaultValue={item.target_url} className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 w-full text-sm" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="hidden" name="is_visible" value="false" />
                      <input type="checkbox" name="is_visible" value="true" defaultChecked={item.is_visible} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0ea5a0]" />
                      <span className="ml-3 text-sm text-gray-600">Tampilkan</span>
                    </label>
                  </div>
                  <input type="hidden" name="sort_order" value={item.sort_order} />
                  <div className="flex items-center gap-2 pt-2">
                    <button type="submit" className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                      Simpan
                    </button>
                    <button type="submit" formAction={deleteNav} className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                      Hapus
                    </button>
                  </div>
                </form>
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  )
}
