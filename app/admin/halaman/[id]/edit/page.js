import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import PageForm from '@/components/admin/PageForm'
import { demoPages } from '@/app/admin/halaman/page'

async function getPage(id) {
  try {
    const supabase = await createClient()
    const { data: page } = await supabase.from('pages').select('*').eq('id', id).single()
    if (page) return page
  } catch {}
  return demoPages.find(p => p.id === id) || null
}

export default async function AdminHalamanEdit({ params }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const page = await getPage(id)

  if (!page) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Halaman tidak ditemukan</p>
        <a href="/admin/halaman" className="text-[#0ea5a0] hover:text-[#0d7a8a] text-sm font-semibold mt-2 inline-block">Kembali ke Halaman</a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Edit Halaman</h1>
          <p className="text-sm text-gray-500 mt-0.5">{page.title}</p>
        </div>
      </div>
      <PageForm initialData={page} />
    </div>
  )
}
