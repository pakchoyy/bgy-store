'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ReviewsManager({ initialReviews }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [filter, setFilter] = useState('all') // all, pending, approved
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedReviews, setSelectedReviews] = useState(new Set())
  const [message, setMessage] = useState(null)

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && !review.is_approved) ||
      (filter === 'approved' && review.is_approved)

    const matchesSearch =
      search === '' ||
      review.reviewer_name.toLowerCase().includes(search.toLowerCase()) ||
      review.comment?.toLowerCase().includes(search.toLowerCase()) ||
      review.product?.title.toLowerCase().includes(search.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // Toggle review selection
  function toggleSelection(reviewId) {
    const newSelected = new Set(selectedReviews)
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId)
    } else {
      newSelected.add(reviewId)
    }
    setSelectedReviews(newSelected)
  }

  // Select all visible
  function selectAll() {
    if (selectedReviews.size === filteredReviews.length) {
      setSelectedReviews(new Set())
    } else {
      setSelectedReviews(new Set(filteredReviews.map((r) => r.id)))
    }
  }

  // Approve review(s)
  async function approveReview(reviewId) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          reviewIds: [reviewId],
        }),
      })

      if (response.ok) {
        setReviews(reviews.map((r) => (r.id === reviewId ? { ...r, is_approved: true } : r)))
        setMessage({ type: 'success', text: 'Review disetujui' })
      } else {
        setMessage({ type: 'error', text: 'Gagal menyetujui review' })
      }
    } catch (error) {
      console.error('Error approving review:', error)
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setIsLoading(false)
    }
  }

  // Delete review(s)
  async function deleteReview(reviewId) {
    if (!confirm('Yakin hapus review ini?')) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewIds: [reviewId],
        }),
      })

      if (response.ok) {
        setReviews(reviews.filter((r) => r.id !== reviewId))
        setMessage({ type: 'success', text: 'Review dihapus' })
      } else {
        setMessage({ type: 'error', text: 'Gagal menghapus review' })
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setIsLoading(false)
    }
  }

  // Bulk approve
  async function bulkApprove() {
    if (selectedReviews.size === 0) return
    if (!confirm(`Setujui ${selectedReviews.size} review?`)) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          reviewIds: Array.from(selectedReviews),
        }),
      })

      if (response.ok) {
        setReviews(
          reviews.map((r) =>
            selectedReviews.has(r.id) ? { ...r, is_approved: true } : r
          )
        )
        setSelectedReviews(new Set())
        setMessage({
          type: 'success',
          text: `${selectedReviews.size} review disetujui`,
        })
      } else {
        setMessage({ type: 'error', text: 'Gagal menyetujui review' })
      }
    } catch (error) {
      console.error('Error bulk approving:', error)
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setIsLoading(false)
    }
  }

  // Bulk delete
  async function bulkDelete() {
    if (selectedReviews.size === 0) return
    if (!confirm(`Hapus ${selectedReviews.size} review?`)) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewIds: Array.from(selectedReviews),
        }),
      })

      if (response.ok) {
        setReviews(reviews.filter((r) => !selectedReviews.has(r.id)))
        setSelectedReviews(new Set())
        setMessage({
          type: 'success',
          text: `${selectedReviews.size} review dihapus`,
        })
      } else {
        setMessage({ type: 'error', text: 'Gagal menghapus review' })
      }
    } catch (error) {
      console.error('Error bulk deleting:', error)
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setIsLoading(false)
    }
  }

  const pendingCount = reviews.filter((r) => !r.is_approved).length
  const approvedCount = reviews.filter((r) => r.is_approved).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Review Produk</h1>
        <Link
          href="/admin"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Kembali
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm font-semibold text-gray-600">Total Review</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">
            {reviews.length}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-sm font-semibold text-yellow-900">Menunggu Approval</div>
          <div className="text-3xl font-bold text-yellow-900 mt-1">
            {pendingCount}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm font-semibold text-green-900">Disetujui</div>
          <div className="text-3xl font-bold text-green-900 mt-1">
            {approvedCount}
          </div>
        </div>
      </div>

      {/* Message */}
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

      {/* Filters & Search */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Semua' : f === 'pending' ? 'Menunggu' : 'Disetujui'}{' '}
              ({f === 'all' ? reviews.length : f === 'pending' ? pendingCount : approvedCount})
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Cari review..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {/* Bulk Actions */}
      {selectedReviews.size > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center justify-between">
          <div className="text-sm font-medium text-blue-900">
            {selectedReviews.size} review dipilih
          </div>
          <div className="flex gap-2">
            <button
              onClick={bulkApprove}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              ✓ Setujui
            </button>
            <button
              onClick={bulkDelete}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              🗑️ Hapus
            </button>
          </div>
        </div>
      )}

      {/* Reviews Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {reviews.length === 0 ? 'Belum ada review' : 'Tidak ada review sesuai filter'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        filteredReviews.length > 0 &&
                        selectedReviews.size === filteredReviews.length
                      }
                      onChange={selectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Reviewer
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Produk
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Komentar
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => (
                  <tr
                    key={review.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 ${
                      selectedReviews.has(review.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedReviews.has(review.id)}
                        onChange={() => toggleSelection(review.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {review.reviewer_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {review.reviewer_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {review.product?.title || 'Produk Dihapus'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={
                              star <= review.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                      {review.comment || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          review.is_approved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {review.is_approved ? '✓ Disetujui' : '⏳ Menunggu'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {new Date(review.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      {!review.is_approved && (
                        <button
                          onClick={() => approveReview(review.id)}
                          disabled={isLoading}
                          className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 disabled:opacity-50"
                        >
                          Setujui
                        </button>
                      )}
                      <button
                        onClick={() => deleteReview(review.id)}
                        disabled={isLoading}
                        className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
