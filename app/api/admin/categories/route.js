import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'
import { generateSlug } from '@/lib/utils'

function isDemoMode() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !supabaseUrl || supabaseUrl === 'your_supabase_url'
}

function sanitizeCategory(body) {
  return {
    name: (body.name || '').trim(),
    slug: (body.slug || generateSlug(body.name || '')).trim(),
    color: body.color || '#0ea5a0',
    sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    if (isDemoMode()) {
      const category = sanitizeCategory(body)
      return Response.json({ success: true, demo: true, category: { ...category, id: 'demo-' + Date.now(), product_count: 0 } })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const category = sanitizeCategory(body)
    if (!category.name) {
      return Response.json({ error: 'name is required' }, { status: 400 })
    }

    const { data, error } = await supabase.from('categories').insert(category).select().single()
    if (error) {
      console.error('POST /api/admin/categories insert error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, category: { ...data, product_count: 0 } })
  } catch (e) {
    console.error('POST /api/admin/categories unexpected error:', e)
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

    if (isDemoMode()) {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const category = sanitizeCategory({ ...rest, name: rest.name ?? '', slug: rest.slug })
    const patch = {}
    if (rest.name !== undefined) patch.name = category.name
    if (rest.slug !== undefined) patch.slug = category.slug
    if (rest.color !== undefined) patch.color = rest.color
    if (rest.sort_order !== undefined) patch.sort_order = rest.sort_order

    const { data, error } = await supabase.from('categories').update(patch).eq('id', id).select().single()
    if (error) {
      console.error('PUT /api/admin/categories update error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, category: data })
  } catch (e) {
    console.error('PUT /api/admin/categories unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const categories = Array.isArray(body.categories) ? body.categories : []

    if (!categories.length) {
      return Response.json({ error: 'categories required for reorder' }, { status: 400 })
    }

    if (isDemoMode()) {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const updates = categories
      .filter((c) => c.id)
      .map((c) => supabase.from('categories').update({ sort_order: c.sort_order }).eq('id', c.id))

    const results = await Promise.all(updates)
    const error = results.find((result) => result.error)?.error
    if (error) {
      console.error('PATCH /api/admin/categories reorder error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/admin/categories unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({ error: 'id required for delete' }, { status: 400 })
    }

    if (isDemoMode()) {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .is('deleted_at', null)

    if (count > 0) {
      return Response.json({ error: `Tidak dapat menghapus, masih ada ${count} produk pada kategori ini.` }, { status: 409 })
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      console.error('DELETE /api/admin/categories error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/categories unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
