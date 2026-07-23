import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoFooterConfig } from '@/lib/demo-data'

async function saveFooter(formData) {
  'use server'
  const raw = Object.fromEntries(formData)
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
  ) {
    redirect('/admin/footer?toast=demo')
  }
  const configEntries = [
    { key: 'copyright_text', value: raw.copyright_text || '' },
    { key: 'description', value: raw.description || '' },
  ]
  for (const entry of configEntries) {
    const { error } = await supabase.from('footer_config').upsert(entry, { onConflict: 'key' })
    if (error) redirect('/admin/footer?toast=error')
  }
  redirect('/admin/footer?toast=success')
}

function getConfig(configs, key, fallback = '') {
  const found = configs.find((c) => c.key === key)
  return found ? found.value : fallback
}

export default async function AdminFooter({ searchParams }) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const toast = searchParams?.toast
  const isDemo =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

  let configs = []
  if (!isDemo) {
    const { data: c } = await supabase.from('footer_config').select('*')
    if (c) configs = c
  }
  if (!configs.length) configs = demoFooterConfig

  const copyright = getConfig(
    configs,
    'copyright_text',
    '© 2026 Bantu Guru Yuk. All rights reserved.'
  )
  const desc = getConfig(configs, 'description', '')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">Footer</h1>
          <p className="text-sm text-gray-500">Penjelasan BGY + copyright saja</p>
        </div>
      </div>

      {isDemo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800 mb-6">
          Mode Demo — Data tidak disimpan
        </div>
      )}
      {toast && (
        <div
          className={`border rounded-lg px-4 py-2 text-sm mb-6 ${
            toast === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : toast === 'demo'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast === 'success'
            ? 'Footer tersimpan!'
            : toast === 'demo'
              ? 'Mode Demo — tidak disimpan'
              : 'Gagal menyimpan'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form action={saveFooter} className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Pengaturan Footer</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Penjelasan BGY
            </label>
            <textarea
              name="description"
              rows={4}
              defaultValue={desc}
              className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm resize-y"
              placeholder="Deskripsi singkat tentang Bantu Guru Yuk..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Copyright</label>
            <input
              name="copyright_text"
              defaultValue={copyright}
              className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90"
          >
            Simpan
          </button>
        </form>

        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Preview</h2>
          <div className="bg-gray-50 rounded-2xl border border-gray-100 px-5 py-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-7 h-7 bg-[#0ea5a0]/15 rounded-lg flex items-center justify-center">
                <span className="text-[#0ea5a0] font-extrabold text-xs">BGY</span>
              </div>
              <span className="text-sm font-extrabold text-gray-900">Bantu Guru Yuk</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {desc || 'Deskripsi footer akan tampil di sini'}
            </p>
            <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-gray-200">
              {copyright}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
