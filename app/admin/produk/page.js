import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoProducts, demoCategories } from '@/lib/demo-data'
import ProductBuilder from '@/components/admin/ProductBuilder'

export const dynamic = 'force-dynamic'

async function getData() {
  try {
    const supabase = await createClient()
    const { data: products } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    if (products?.length) {
      return { products, categories: categories || demoCategories }
    }
  } catch {}
  const saved = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('_bgym_demo_products') || '[]') : []
  const demoProductsToUse = saved.length ? saved : demoProducts
  const productsWithCat = demoProductsToUse.map((p) => ({
    ...p,
    category: demoCategories.find((c) => c.id === p.category_id) || null,
  }))
  return { products: productsWithCat, categories: demoCategories }
}

export default async function AdminProduk() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { products, categories } = await getData()

  return (
    <ProductBuilder products={products} categories={categories} siteName="BGY" />
  )
}
