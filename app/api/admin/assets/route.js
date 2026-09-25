import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

function isDemoMode() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !supabaseUrl || supabaseUrl === 'your_supabase_url'
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { key, media_id } = body

    if (!key || !media_id) {
      return Response.json({ error: 'key dan media_id diperlukan' }, { status: 400 })
    }

    if (isDemoMode()) {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const { data, error } = await supabase
      .from('assets')
      .update({ media_id, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select('*, media:media(url, name)')
      .single()

    if (error) {
      console.error('PUT /api/admin/assets error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, asset: data })
  } catch (e) {
    console.error('PUT /api/admin/assets unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return Response.json({ error: 'key diperlukan' }, { status: 400 })
    }

    if (isDemoMode()) {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    const { error } = await supabase
      .from('assets')
      .update({ media_id: null, updated_at: new Date().toISOString() })
      .eq('key', key)

    if (error) {
      console.error('DELETE /api/admin/assets error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/assets unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
