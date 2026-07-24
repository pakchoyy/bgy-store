import { createClient } from '@/lib/supabase-server'
import { generateSlug } from '@/lib/utils'

function sanitizeProduct(body, includeCardLayout = true) {
  const product = {
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
    meta_title: body.meta_title || null,
    meta_description: body.meta_description || null,
    is_active: body.is_active !== false,
    published_at: body.is_active ? new Date().toISOString() : null,
    deleted_at: null,
  }
  if (includeCardLayout) {
    product.card_layout = body.card_layout || 'landscape'
  }
  return product
}

function isMissingColumnError(error) {
  const msg = (error?.message || '').toLowerCase()
  return msg.includes('card_layout') || msg.includes('column') || msg.includes('does not exist')
}

export async function POST(request) {
  try {
    const body = await request.json()

    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      const product = sanitizeProduct(body)
      return Response.json({ success: true, demo: true, product: { ...product, id: 'demo-' + Date.now() } })
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (clientErr) {
      console.error('POST /api/admin/products createClient error:', clientErr)
      return Response.json({ error: 'Gagal membuat client Supabase: ' + (clientErr.message || 'unknown') }, { status: 500 })
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const product = sanitizeProduct(body)

    if (!product.title) {
      return Response.json({ error: 'title is required' }, { status: 400 })
    }

    let result = await supabase.from('products').insert(product).select().single()

    if (result.error && isMissingColumnError(result.error)) {
      console.warn('POST /api/admin/products card_layout column missing, retrying without it')
      const productWithoutLayout = sanitizeProduct(body, false)
      result = await supabase.from('products').insert(productWithoutLayout).select().single()
    }

    if (result.error) {
      console.error('POST /api/admin/products insert error:', result.error)
      return Response.json({ error: result.error.message || 'Gagal menyimpan produk' }, { status: 500 })
    }

    return Response.json({ success: true, product: result.data })
  } catch (e) {
    console.error('POST /api/admin/products unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, ...rest } = body

    if (!id) {
      return Response.json({ error: 'id required for update' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      return Response.json({ success: true, demo: true })
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (clientErr) {
      console.error('PUT /api/admin/products createClient error:', clientErr)
      return Response.json({ error: 'Gagal membuat client Supabase: ' + (clientErr.message || 'unknown') }, { status: 500 })
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const product = sanitizeProduct(rest)

    let result = await supabase.from('products').update(product).eq('id', id).select().single()

    if (result.error && isMissingColumnError(result.error)) {
      console.warn('PUT /api/admin/products card_layout column missing, retrying without it')
      const productWithoutLayout = sanitizeProduct(rest, false)
      result = await supabase.from('products').update(productWithoutLayout).eq('id', id).select().single()
    }

    if (result.error) {
      console.error('PUT /api/admin/products update error:', result.error)
      return Response.json({ error: result.error.message || 'Gagal memperbarui produk' }, { status: 500 })
    }

    return Response.json({ success: true, product: result.data })
  } catch (e) {
    console.error('PUT /api/admin/products unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
