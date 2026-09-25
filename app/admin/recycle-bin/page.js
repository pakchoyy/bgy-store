import { createClient } from '@/lib/supabase-server'
import RecycleBinList from '@/components/admin/RecycleBinList'

async function getData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('id, title, type, sale_price, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
    return data || []
  } catch {
    return []
  }
}

export default async function AdminRecycleBin() {
  const products = await getData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Recycle Bin</h1>
        <p className="text-sm text-gray-500 mt-0.5">Produk yang dihapus, bisa dipulihkan sebelum dihapus permanen</p>
      </div>
      <RecycleBinList products={products} />
    </div>
  )
}
