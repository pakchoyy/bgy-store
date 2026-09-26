import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'

async function getCategories() {
  try {
    const supabase = await createClient()
    const { data: categories } = await supabase.from('categories').select('*').order('sort_order')
    if (categories) return categories
  } catch {}
  return []
}

async function getProductOptions() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('products').select('id, title, type, sale_price').is('deleted_at', null).order('title')
    if (data) return data
  } catch {}
  return []
}

export default async function AdminProdukBaru() {
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
  if (!isDemo) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')
  }

  const categories = await getCategories()

  const productOptions = await getProductOptions()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Tambah Produk Baru</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lengkapi informasi produk di bawah ini</p>
        </div>
      </div>
      <ProductForm categories={categories} productOptions={productOptions} />
    </div>
  )
}
