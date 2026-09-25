'use client'

import { useEffect, useState } from 'react'

export default function ProductReviewList({ productId }) {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/reviews?product_id=${productId}&limit=10`)
        const data = await response.json()

        if (response.ok) {
          setReviews(data.reviews || [])
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [productId])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-32 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!reviews.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Belum ada review untuk produk ini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Rating Stats */}
      {stats && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.average_rating}
              </div>
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= Math.round(stats.average_rating) ? 'text-yellow-400' : 'text-gray-300'}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 text-sm text-gray-600">
              <p className="font-semibold">{stats.total_reviews} review</p>
              <p className="text-xs">dari pembeli yang terverifikasi</p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {/* Rating Stars */}
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= review.rating ? 'text-yellow-400 text-lg' : 'text-gray-300 text-lg'}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-sm text-gray-700 leading-relaxed">
                {review.comment}
              </p>
            )}

            {/* Verified Badge */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full inline-flex items-center gap-1">
                ✓ Pembeli Terverifikasi
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
