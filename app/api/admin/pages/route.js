import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'
import { generateSlug } from '@/lib/utils'

function isDemoMode() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !supabaseUrl || supabaseUrl === 'your_supabase_url'
}

function sanitizePage(body) {
  return {
    title: (body.title || '').trim(),
    slug: (body.slug || generateSlug(body.title || '')).trim(),
    content: body.content || '',
    is_active: !!body.is_active,
    meta_title: body.meta_title || null,
    meta_desc: body.meta_description || body.meta_desc || null,
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    if (isDemoMode()) {
      const page = sanitizePage(body)
      return Response.json({ success: true, demo: true, page: { ...page, id: 'demo-' + Date.now() } })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const page = sanitizePage(body)
    if (!page.title) {
      return Response.json({ error: 'title is required' }, { status: 400 })
    }

    const { data, error } = await supabase.from('pages').insert(page).select().single()
    if (error) {
      console.error('POST /api/admin/pages insert error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, page: data })
  } catch (e) {
    console.error('POST /api/admin/pages unexpected error:', e)
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

    const page = sanitizePage(rest)
    const { data, error } = await supabase
      .from('pages')
      .update({ ...page, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('PUT /api/admin/pages update error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, page: data })
  } catch (e) {
    console.error('PUT /api/admin/pages unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const ids = Array.isArray(body.ids) ? body.ids : []

    if (!ids.length || typeof body.is_active !== 'boolean') {
      return Response.json({ error: 'ids and is_active required' }, { status: 400 })
    }

    if (isDemoMode()) {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const { error } = await supabase
      .from('pages')
      .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
      .in('id', ids)

    if (error) {
      console.error('PATCH /api/admin/pages error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/admin/pages unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    const ids = idsParam ? idsParam.split(',').filter(Boolean) : []

    if (!ids.length) {
      return Response.json({ error: 'ids required for delete' }, { status: 400 })
    }

    if (isDemoMode()) {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const { error } = await supabase.from('pages').delete().in('id', ids)
    if (error) {
      console.error('DELETE /api/admin/pages error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/pages unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
