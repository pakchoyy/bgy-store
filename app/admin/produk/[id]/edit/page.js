import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoProducts, demoCategories } from '@/lib/demo-data'
import ProductForm from '@/components/admin/ProductForm'

async function getProduct(id) {
  try {
    const supabase = await createClient()
    const { data: product } = await supabase.from('products').select('*, category:categories(*)').eq('id', id).single()
    if (product) return product
  } catch {}
  return demoProducts.find(p => p.id === id) || null
}

async function getCategories() {
  try {
    const supabase = await createClient()
    const { data: categories } = await supabase.from('categories').select('*').order('sort_order')
    if (categories) return categories
  } catch {}
  return demoCategories
}

export default async function AdminProdukEdit({ params }) {
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
  if (!isDemo) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')
  }

  const { id } = await params
  const product = await getProduct(id)
  const categories = await getCategories()

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Produk tidak ditemukan</p>
        <a href="/admin/produk" className="text-[#0ea5a0] hover:text-[#0d7a8a] text-sm font-semibold mt-2 inline-block">Kembali ke Produk</a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Edit Produk</h1>
          <p className="text-sm text-gray-500 mt-0.5">{product.title}</p>
        </div>
      </div>
      <ProductForm initialData={product} categories={categories} />
    </div>
  )
}
