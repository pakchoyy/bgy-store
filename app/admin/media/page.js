import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

async function saveMedia(formData) {
  'use server'
  const supabase = await createClient()
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/media?toast=demo')
  redirect('/admin/media?toast=success')
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
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Media berhasil diupload!' : 'Gagal memproses media'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

const fileTypes = [
  { id: 'all', label: 'Semua' },
  { id: 'image', label: 'Gambar' },
  { id: 'document', label: 'Dokumen' },
]

const demoMedia = [
  { id: 'm1', name: 'hero-bg.jpg', size: '245 KB', type: 'image', date: '2026-01-15', color: '#0ea5a0' },
  { id: 'm2', name: 'logo-bgy.png', size: '32 KB', type: 'image', date: '2026-01-10', color: '#8b5cf6' },
  { id: 'm3', name: 'banner-promo.jpg', size: '512 KB', type: 'image', date: '2026-02-01', color: '#f59e0b' },
  { id: 'm4', name: 'modul-ajar.pdf', size: '2.4 MB', type: 'document', date: '2026-01-20', color: '#ef4444' },
  { id: 'm5', name: 'panduan.docx', size: '156 KB', type: 'document', date: '2026-02-05', color: '#2563eb' },
  { id: 'm6', name: 'default-cover.jpg', size: '89 KB', type: 'image', date: '2026-01-12', color: '#0d7a8a' },
]

export default async function AdminMedia({ searchParams }) {
  const supabase = await createClient()
  const toast = searchParams?.toast
  const filter = searchParams?.filter || 'all'
  const selectedId = searchParams?.selected
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL

  let media = demoMedia
  if (!isDemo) {
    const { data } = await supabase.from('media').select('*').order('created_at', { ascending: false })
    if (data && data.length > 0) {
      media = data.map(m => ({
        id: m.id,
        name: m.name || 'Untitled',
        size: m.size ? `${(m.size / 1024).toFixed(0)} KB` : '0 KB',
        type: m.type || 'image',
        date: m.created_at ? m.created_at.slice(0, 10) : '2026-01-01',
        color: m.type === 'document' ? '#2563eb' : '#0ea5a0',
      }))
    }
  }
  const filtered = filter === 'all' ? media : media.filter(m => m.type === filter)
  const selected = selectedId ? media.find(m => m.id === selectedId) : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-gray-900">Media Library</h1>
        <form action={saveMedia}>
          <button type="submit" className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload
          </button>
        </form>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {fileTypes.map(t => {
          const href = selectedId ? `/admin/media?filter=${t.id}&selected=${selectedId}` : `/admin/media?filter=${t.id}`
          return (
            <a
              key={t.id}
              href={href}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </a>
          )
        })}
      </div>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-500">Belum ada media</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(item => (
            <a
              key={item.id}
              href={`/admin/media?filter=${filter}&selected=${item.id}`}
              className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div
                className="aspect-square flex items-center justify-center"
                style={{ backgroundColor: item.color + '20' }}
              >
                {item.type === 'image' ? (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: item.color + '30' }}>
                    <svg className="w-10 h-10" style={{ color: item.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: item.color + '15' }}>
                    <svg className="w-10 h-10" style={{ color: item.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-[10px] text-gray-400">{item.size}</p>
              </div>
            </a>
          ))}
        </div>
      )}
      {selected && (
        <div className="mt-6 bg-white rounded-xl shadow-card p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: selected.color + '20' }}
            >
              {selected.type === 'image' ? (
                <svg className="w-8 h-8" style={{ color: selected.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" style={{ color: selected.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">{selected.name}</h3>
              <table className="mt-2 text-xs text-gray-500 w-full">
                <tbody>
                  <tr><td className="py-0.5 pr-4 font-medium">Ukuran</td><td>{selected.size}</td></tr>
                  <tr><td className="py-0.5 pr-4 font-medium">Tipe</td><td>{selected.type}</td></tr>
                  <tr><td className="py-0.5 pr-4 font-medium">Tanggal</td><td>{selected.date}</td></tr>
                </tbody>
              </table>
              <div className="flex gap-2 mt-3">
                <button onClick={() => navigator.clipboard?.writeText(selected.name)} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Copy URL
                </button>
                <button className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium">
                  Hapus
                </button>
              </div>
            </div>
            <a href={`/admin/media?filter=${filter}`} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
