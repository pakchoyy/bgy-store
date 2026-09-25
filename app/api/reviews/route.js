import { createServiceClient } from '@/lib/supabase-server'

// POST /api/reviews - Create new review
export async function POST(request) {
  try {
    const { product_id, order_id, reviewer_name, reviewer_email, rating, comment } = await request.json()

    // Validasi input
    if (!product_id || !order_id || !reviewer_name || !rating) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return Response.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Rate limit: max 5 reviews per email per day
    const supabase = await createServiceClient()
    const { count: reviewCount } = await supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('reviewer_email', reviewer_email)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (reviewCount >= 5) {
      return Response.json(
        { error: 'Too many reviews. Max 5 per day.' },
        { status: 429 }
      )
    }

    // Validasi order: harus status paid dan milik product ini
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, product_id')
      .eq('id', order_id)
      .single()

    if (orderError || !order || order.status !== 'paid' || order.product_id !== product_id) {
      return Response.json(
        { error: 'Invalid order. Only paid orders can review.' },
        { status: 403 }
      )
    }

    // Cek apakah sudah ada review dari user untuk produk ini
    const { data: existingReview } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('order_id', order_id)
      .single()

    if (existingReview) {
      return Response.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    // Sanitize comment
    const sanitizedComment = comment
      ? comment
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .slice(0, 1000) // Max 1000 chars
      : null

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('product_reviews')
      .insert({
        product_id,
        order_id,
        reviewer_name: reviewer_name.slice(0, 100),
        reviewer_email,
        rating,
        comment: sanitizedComment,
        is_approved: false, // Admin approval needed
      })
      .select()
      .single()

    if (reviewError) {
      console.error('[API] Review creation error:', reviewError)
      return Response.json(
        { error: 'Failed to create review' },
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
    const { data: reviews, error: reviewsError } = await supabase
      .from('product_reviews')
      .select('id, reviewer_name, rating, comment, created_at')
      .eq('product_id', product_id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(limit)

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
