import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

function isDemoMode() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !supabaseUrl || supabaseUrl === 'your_supabase_url'
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const ids = Array.isArray(body.ids) ? body.ids : null

    if (isDemoMode()) {
      return Response.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const auth = await requireAdmin(supabase)
    if (auth.error) return auth.error

    let query = supabase.from('notifications').update({ is_read: true })
    query = ids ? query.in('id', ids) : query.eq('is_read', false)

    const { error } = await query
    if (error) {
      console.error('PATCH /api/admin/notifications error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/admin/notifications unexpected error:', e)
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
