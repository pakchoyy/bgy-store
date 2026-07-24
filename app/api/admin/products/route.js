import { createClient } from '@/lib/supabase-server'
import { generateSlug } from '@/lib/utils'

function sanitizeProduct(body) {
  return {
    title: (body.title || '').trim(),
    slug: (body.slug || generateSlug(body.title || '')).trim(),
    description: (body.description || '').trim(),
    category_id: body.category_id || null,
    type: body.type === 'paid' ? 'paid' : 'free',
    sale_price: typeof body.sale_price === 'number' ? body.sale_price : 0,
    original_price: typeof body.original_price === 'number' ? body.original_price : null,
    stock_type: body.stock_type === 'limited' ? 'limited' : 'unlimited',
    stock_qty: typeof body.stock_qty === 'number' ? body.stock_qty : null,
    badge: body.badge || null,
    badge_custom: body.badge_custom || null,
    is_featured: !!body.is_featured,
    cover_path: body.cover_path || null,
    preview_path: body.preview_path || null,
    file_path: body.file_path || null,
    file_size: body.file_size || null,
    card_layout: body.card_layout || 'landscape',
    meta_title: body.meta_title || null,
    meta_description: body.meta_description || null,
    is_active: body.is_active !== false,
    published_at: body.is_active ? new Date().toISOString() : null,
    deleted_at: null,
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const product = sanitizeProduct(body)

    if (!product.title) {
      return Response.json({ error: 'title is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      return Response.json({ success: true, demo: true, product: { ...product, id: 'demo-' + Date.now() } })
    }

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase.from('products').insert(product).select().single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, product: data })
  } catch (e) {
    console.error('POST /api/admin/products', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, ...rest } = body
    const product = sanitizeProduct(rest)

    if (!id) {
      return Response.json({ error: 'id required for update' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase.from('products').update(product).eq('id', id).select().single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, product: data })
  } catch (e) {
    console.error('PUT /api/admin/products', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
