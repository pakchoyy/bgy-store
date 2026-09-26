import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProductBuilder from '@/components/admin/ProductBuilder'
import { demoSettings } from '@/lib/demo-data'
import { getAppearance, settingsToMap } from '@/lib/utils'

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
    const { data: settingsRows } = await supabase.from('settings').select('*')
    return {
      products: products || [],
      categories: categories || [],
      contentBlocks: contentBlocks || [],
      appearance: getAppearance(settingsRows?.length ? settingsToMap(settingsRows) : demoSettings),
    }
  } catch {}
  return { products: [], categories: [], contentBlocks: [], appearance: getAppearance(demoSettings) }
}

export default async function AdminProduk() {
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
  if (!isDemo) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')
  }

  const { products, categories, contentBlocks, appearance } = await getData()

  return (
    <ProductBuilder products={products} categories={categories} contentBlocks={contentBlocks} appearance={appearance} />
  )
}
