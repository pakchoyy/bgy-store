import { createServiceClient } from '@/lib/supabase-server'

// PATCH /api/admin/reviews - Approve reviews
export async function PATCH(request) {
  try {
    const { action, reviewIds } = await request.json()

    if (!action || !reviewIds || reviewIds.length === 0) {
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
    const { reviewIds } = await request.json()

    if (!reviewIds || reviewIds.length === 0) {
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
