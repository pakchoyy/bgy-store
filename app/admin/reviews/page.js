import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ReviewsManager from '@/components/admin/ReviewsManager'

export const dynamic = 'force-dynamic'

async function getReviews() {
  try {
    const supabase = await createClient()
    const { data: reviews } = await supabase
      .from('product_reviews')
      .select('*, product:products(id, title, slug)')
      .order('created_at', { ascending: false })

    return { reviews: reviews || [] }
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return { reviews: [] }
  }
}

export default async function AdminReviews() {
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
  if (!isDemo) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')
  }

  const { reviews } = await getReviews()

  return <ReviewsManager initialReviews={reviews} />
}
