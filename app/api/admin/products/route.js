import { createClient } from '@/lib/supabase-server'

export async function GET() {
  return Response.json({ message: 'Admin Products API' })
}

export async function POST() {
  return Response.json({ message: 'Admin Products API' })
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const products = body?.products

    if (!Array.isArray(products)) {
      return Response.json({ error: 'products array required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    for (const p of products) {
      if (!p.id || String(p.id).startsWith('prod-') || String(p.id).startsWith('seed-')) {
        continue
      }
      const payload = {}
      if (typeof p.sort_order === 'number') payload.sort_order = p.sort_order
      if (typeof p.is_active === 'boolean') payload.is_active = p.is_active

      if (Object.keys(payload).length === 0) continue

      const { error } = await supabase.from('products').update(payload).eq('id', p.id)
      if (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/admin/products', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
