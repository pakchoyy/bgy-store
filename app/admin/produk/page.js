import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
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
    const { data: contentBlocks } = await supabase
      .from('content_blocks')
      .select('*')
      .order('sort_order', { ascending: true })
    return { products: products || [], categories: categories || [], contentBlocks: contentBlocks || [] }
  } catch {}
  return { products: [], categories: [], contentBlocks: [] }
}

export default async function AdminProduk() {
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
  if (!isDemo) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')
  }

  const { products, categories, contentBlocks } = await getData()

  return (
    <ProductBuilder products={products} categories={categories} contentBlocks={contentBlocks} siteName="BGY" />
  )
}
