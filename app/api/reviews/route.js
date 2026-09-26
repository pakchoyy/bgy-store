import { createServiceClient } from '@/lib/supabase-server'

// POST /api/reviews - Create new review
export async function POST(request) {
  try {
    const { product_id, order_id, reviewer_name, reviewer_institution, rating, comment } = await request.json()
    const name = String(reviewer_name || '').replace(/<[^>]*>/g, '').trim().slice(0, 100)
    const institution = String(reviewer_institution || '').replace(/<[^>]*>/g, '').trim().slice(0, 120) || null

    // Validasi input
    if (!product_id || !order_id || !name || !rating) {
      return Response.json(
        { error: 'Nama dan rating wajib diisi.' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return Response.json(
        { error: 'Rating harus 1 sampai 5.' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // Validasi order: harus status paid dan milik product ini
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, product_id, buyer_email')
      .eq('id', order_id)
      .single()

    if (orderError || !order || order.status !== 'paid' || order.product_id !== product_id) {
      return Response.json(
        { error: 'Review hanya untuk pesanan yang sudah dibayar.' },
        { status: 403 }
      )
    }

    // Cek apakah sudah ada review dari user untuk produk ini
    const { data: existingReview } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle()

    if (existingReview) {
      return Response.json(
        { error: 'Kamu sudah memberi review untuk pesanan ini. Terima kasih!' },
        { status: 400 }
      )
    }

    // Sanitize comment
    const sanitizedComment = comment
      ? comment
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .slice(0, 1000) // Max 1000 chars
      : null

    const row = {
      product_id,
      order_id,
      reviewer_name: name,
      reviewer_email: order.buyer_email || null,
      rating,
      comment: sanitizedComment,
      is_approved: false,
    }
    let { data: review, error: reviewError } = await supabase
      .from('product_reviews')
      .insert({ ...row, reviewer_institution: institution })
      .select()
      .single()

    if (reviewError && /reviewer_institution/.test(reviewError.message || '')) {
      ;({ data: review, error: reviewError } = await supabase
        .from('product_reviews')
        .insert({ ...row, reviewer_name: institution ? `${name} · ${institution}`.slice(0, 100) : name })
        .select()
        .single())
    }

    if (reviewError) {
      console.error('[API] Review creation error:', reviewError)
      return Response.json(
        { error: 'Review gagal dikirim. Coba lagi.' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      review: { id: review.id, rating: review.rating, is_approved: review.is_approved },
      message: 'Review submitted. Waiting for approval.',
    })
  } catch (error) {
    console.error('[API] Reviews POST error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/reviews?product_id=xyz - Get approved reviews for product
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get('product_id')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '5', 10) || 5, 1), 20)

    if (!product_id) {
      return Response.json(
        { error: 'Missing product_id' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // Get approved reviews with average rating
    const reviewQuery = (columns) => supabase
      .from('product_reviews')
      .select(columns)
      .eq('product_id', product_id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    let { data: reviews, error: reviewsError } = await reviewQuery('id, reviewer_name, reviewer_institution, rating, comment, created_at')
    if (reviewsError && /reviewer_institution/.test(reviewsError.message || '')) {
      ;({ data: reviews, error: reviewsError } = await reviewQuery('id, reviewer_name, rating, comment, created_at'))
    }

    if (reviewsError) {
      console.error('[API] Reviews GET error:', reviewsError)
      return Response.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    // Calculate stats
    const { data: stats } = await supabase
      .from('product_reviews')
      .select('rating')
      .eq('product_id', product_id)
      .eq('is_approved', true)

    const avgRating = stats && stats.length > 0
      ? (stats.reduce((sum, r) => sum + r.rating, 0) / stats.length).toFixed(1)
      : 0

    return Response.json({
      reviews,
      stats: {
        total_reviews: stats?.length || 0,
        average_rating: parseFloat(avgRating),
      },
    })
  } catch (error) {
    console.error('[API] Reviews error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
