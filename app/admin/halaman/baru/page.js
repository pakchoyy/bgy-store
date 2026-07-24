import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import PageForm from '@/components/admin/PageForm'

export default async function AdminHalamanBaru() {
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
  if (!isDemo) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Tambah Halaman Baru</h1>
          <p className="text-sm text-gray-500 mt-0.5">Buat halaman statis baru untuk website</p>
        </div>
      </div>
      <PageForm />
    </div>
  )
}
