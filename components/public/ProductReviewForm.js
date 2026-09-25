'use client'

import { useState } from 'react'

export default function ProductReviewForm({ productId, orderId, onSuccess }) {
  const [rating, setRating] = useState(5)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          order_id: orderId,
          reviewer_name: name,
          reviewer_email: email,
          rating: parseInt(rating),
          comment,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: data.error || 'Gagal mengirim review',
        })
        return
      }

      setMessage({
        type: 'success',
        text: 'Terima kasih! Review Anda sedang menunggu persetujuan admin.',
      })

      // Reset form
      setName('')
      setEmail('')
      setComment('')
      setRating(5)

      if (onSuccess) {
        onSuccess(data.review)
      }
    } catch (error) {
      console.error('Review submission error:', error)
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan. Silakan coba lagi.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Tulis Review</h3>

      {message && (
        <div
          className={`rounded-lg p-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl transition-transform ${
                star <= rating ? 'text-yellow-400 scale-110' : 'text-gray-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
          Nama
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama Anda"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a0] focus:border-transparent"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a0] focus:border-transparent"
          required
        />
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-2">
          Komentar (Opsional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Bagikan pengalaman Anda..."
          maxLength={1000}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a0] focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {comment.length}/1000 karakter
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !name || !email}
        className="w-full rounded-lg bg-[#0ea5a0] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0d7a8a] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Mengirim...' : 'Kirim Review'}
      </button>
    </form>
  )
}
