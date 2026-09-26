import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
    return Response.json({ error: 'Supabase belum dikonfigurasi' }, { status: 503 })
  }

  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return auth.error

  const tables = ['products', 'product_faqs', 'categories', 'pages', 'navigation_items', 'content_blocks', 'footer_config', 'footer_links', 'media', 'orders', 'order_items', 'vouchers', 'product_reviews', 'settings']
  const backup = { exported_at: new Date().toISOString() }

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*')
    backup[table] = error ? [] : data
  }

  const filename = `bgy-store-backup-${new Date().toISOString().slice(0, 10)}.json`

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
