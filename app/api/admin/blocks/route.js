import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

function sanitizeBlock(body) {
  const block_type = ['text', 'image', 'link'].includes(body.block_type) ? body.block_type : null
  return {
    block_type,
    title: (body.title || '').trim() || null,
    url: (body.url || '').trim() || null,
    text_content: body.text_content || null,
    background_color: body.background_color || '#ffffff',
    image_path: body.image_path || null,
    is_active: body.is_active !== false,
  }
}

function isDemo() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !supabaseUrl || supabaseUrl === 'your_supabase_url'
}

export async function POST(request) {
  try {
    const body = await request.json()
    const block = sanitizeBlock(body)

    if (!block.block_type) {
      return Response.json({ error: 'block_type harus salah satu: text, image, link' }, { status: 400 })
    }

    if (isDemo()) {
      return Response.json({ success: true, demo: true, block: { ...block, id: 'demo-' + Date.now(), sort_order: body.sort_order || 0 } })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const { data: maxProduct } = await supabase.from('products').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
    const { data: maxBlock } = await supabase.from('content_blocks').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
    const nextSort = Math.max(maxProduct?.sort_order || 0, maxBlock?.sort_order || 0) + 1

    const { data, error } = await supabase
      .from('content_blocks')
      .insert({ ...block, sort_order: nextSort })
      .select()
      .single()

    if (error) {
      console.error('POST /api/admin/blocks insert error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, block: data })
  } catch (e) {
    console.error('POST /api/admin/blocks unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const blocks = Array.isArray(body.blocks) ? body.blocks : []

    if (!blocks.length) {
      return Response.json({ error: 'blocks required for update' }, { status: 400 })
    }

    if (isDemo()) {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const updates = blocks
      .filter((b) => b.id)
      .map((b) =>
        supabase
          .from('content_blocks')
          .update({
            sort_order: typeof b.sort_order === 'number' ? b.sort_order : 0,
            is_active: b.is_active !== false,
          })
          .eq('id', b.id)
      )

    const results = await Promise.all(updates)
    const error = results.find((r) => r.error)?.error
    if (error) {
      console.error('PATCH /api/admin/blocks update error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/admin/blocks unexpected error:', e)
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

    if (isDemo()) {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const { error } = await supabase.from('content_blocks').delete().eq('id', id)
    if (error) {
      console.error('DELETE /api/admin/blocks error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/blocks unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
