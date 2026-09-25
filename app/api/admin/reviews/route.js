import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

async function authorize() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') return null
  const auth = await requireAdmin(await createClient())
  return auth.error || null
}

function validIds(ids) {
  return Array.isArray(ids) && ids.length > 0 && ids.length <= 200 && ids.every((id) => typeof id === 'string')
}

// PATCH /api/admin/reviews - Approve reviews
export async function PATCH(request) {
  try {
    const denied = await authorize()
    if (denied) return denied

    const { action, reviewIds } = await request.json()

    if (!action || !validIds(reviewIds)) {
      return Response.json(
        { error: 'Missing action or reviewIds' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    if (action === 'approve') {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: true })
        .in('id', reviewIds)

      if (error) {
        console.error('[API] Approve error:', error)
        return Response.json({ error: 'Failed to approve reviews' }, { status: 500 })
      }

      return Response.json({ success: true, count: reviewIds.length })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[API] Admin reviews PATCH error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/reviews - Delete reviews
export async function DELETE(request) {
  try {
    const denied = await authorize()
    if (denied) return denied

    const { reviewIds } = await request.json()

    if (!validIds(reviewIds)) {
      return Response.json({ error: 'Missing reviewIds' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .in('id', reviewIds)

    if (error) {
      console.error('[API] Delete error:', error)
      return Response.json({ error: 'Failed to delete reviews' }, { status: 500 })
    }

    return Response.json({ success: true, count: reviewIds.length })
  } catch (error) {
    console.error('[API] Admin reviews DELETE error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
