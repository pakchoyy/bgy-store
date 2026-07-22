import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoProducts, demoCategories } from '@/lib/demo-data'
import ProductTableClient from '@/components/admin/ProductTableClient'

async function getData() {
  try {
    const supabase = await createClient()
    const { data: products } = await supabase.from('products').select('*, category:categories(*)')
    const { data: categories } = await supabase.from('categories').select('*').order('sort_order')
    if (products && categories) return { products, categories }
  } catch {}
  const productsWithCat = demoProducts.map(p => ({
    ...p,
    category: demoCategories.find(c => c.id === p.category_id) || null,
  }))
  return { products: productsWithCat, categories: demoCategories }
}

export default async function AdminProduk() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { products, categories } = await getData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Kelola Produk</h1>
          <p className="text-sm text-gray-500 mt-0.5">Total {products.length} produk</p>
        </div>
      </div>
      <ProductTableClient products={products} categories={categories} />
    </div>
  )
}
