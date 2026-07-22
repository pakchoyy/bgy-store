import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import PageTableClient from '@/components/admin/PageTableClient'

export const demoPages = [
  { id: 'page-1', title: 'Tentang Kami', slug: 'tentang-kami', content: '<h1>Tentang Bantu Guru Yuk</h1>', is_active: true, created_at: '2026-01-15', updated_at: '2026-06-20' },
  { id: 'page-2', title: 'Kebijakan Privasi', slug: 'kebijakan-privasi', content: '<h1>Kebijakan Privasi</h1>', is_active: true, created_at: '2026-01-15', updated_at: '2026-05-10' },
  { id: 'page-3', title: 'Syarat & Ketentuan', slug: 'syarat-dan-ketentuan', content: '<h1>Syarat & Ketentuan</h1>', is_active: true, created_at: '2026-01-15', updated_at: '2026-05-10' },
  { id: 'page-4', title: 'FAQ', slug: 'faq', content: '<h1>FAQ</h1>', is_active: true, created_at: '2026-02-01', updated_at: '2026-06-15' },
  { id: 'page-5', title: 'Cara Pemesanan', slug: 'cara-pemesanan', content: '<h1>Cara Pemesanan</h1>', is_active: false, created_at: '2026-03-10', updated_at: '2026-04-01' },
]

async function getData() {
  try {
    const supabase = await createClient()
    const { data: pages } = await supabase.from('pages').select('*').order('updated_at', { ascending: false })
    if (pages) return pages
  } catch {}
  return demoPages
}

export default async function AdminHalaman() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const pages = await getData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Kelola Halaman</h1>
          <p className="text-sm text-gray-500 mt-0.5">Total {pages.length} halaman</p>
        </div>
      </div>
      <PageTableClient pages={pages} />
    </div>
  )
}
