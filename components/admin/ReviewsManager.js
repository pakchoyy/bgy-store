'use client'

import { useState } from 'react'
import { BackButton } from '@/components/ui/back-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'

export default function ReviewsManager({ initialReviews }) {
  const { addToast } = useToast()
  const [reviews, setReviews] = useState(initialReviews)
  const [filter, setFilter] = useState('all') // all, pending, approved
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedReviews, setSelectedReviews] = useState(new Set())

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
        addToast('Review disetujui', 'success')
      } else {
        addToast('Gagal menyetujui review', 'error')
      }
    } catch (error) {
      console.error('Error approving review:', error)
      addToast('Terjadi kesalahan', 'error')
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
        addToast('Review dihapus', 'success')
      } else {
        addToast('Gagal menghapus review', 'error')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      addToast('Terjadi kesalahan', 'error')
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
        addToast(`${selectedReviews.size} review disetujui`, 'success')
      } else {
        addToast('Gagal menyetujui review', 'error')
      }
    } catch (error) {
      console.error('Error bulk approving:', error)
      addToast('Terjadi kesalahan', 'error')
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
        addToast(`${selectedReviews.size} review dihapus`, 'success')
      } else {
        addToast('Gagal menghapus review', 'error')
      }
    } catch (error) {
      console.error('Error bulk deleting:', error)
      addToast('Terjadi kesalahan', 'error')
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
        <h1 className="text-2xl font-bold text-slate-900">Review Produk</h1>
        <BackButton href="/admin" label="Kembali" showLabel />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-600">Total Review</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">
            {reviews.length}
          </div>
        </Card>
        <Card className="bg-yellow-50 p-4">
          <div className="text-sm font-semibold text-yellow-900">Menunggu Approval</div>
          <div className="text-3xl font-bold text-yellow-900 mt-1">
            {pendingCount}
          </div>
        </Card>
        <Card className="bg-green-50 p-4">
          <div className="text-sm font-semibold text-green-900">Disetujui</div>
          <div className="text-3xl font-bold text-green-900 mt-1">
            {approvedCount}
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Semua' : f === 'pending' ? 'Menunggu' : 'Disetujui'}{' '}
              ({f === 'all' ? reviews.length : f === 'pending' ? pendingCount : approvedCount})
            </Button>
          ))}
        </div>

        <Input
          type="text"
          placeholder="Cari review..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {/* Bulk Actions */}
      {selectedReviews.size > 0 && (
        <Alert className="bg-blue-50 border-blue-200 flex items-center justify-between">
          <AlertDescription className="text-sm font-medium text-blue-900">
            {selectedReviews.size} review dipilih
          </AlertDescription>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={bulkApprove}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              ✓ Setujui
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={bulkDelete}
              disabled={isLoading}
            >
              🗑️ Hapus
            </Button>
          </div>
        </Alert>
      )}

      {/* Reviews Table */}
      <Card className="overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            {reviews.length === 0 ? 'Belum ada review' : 'Tidak ada review sesuai filter'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={
                        filteredReviews.length > 0 &&
                        selectedReviews.size === filteredReviews.length
                      }
                      onChange={selectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Reviewer
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Produk
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Komentar
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredReviews.map((review) => (
                  <tr
                    key={review.id}
                    className={`hover:bg-slate-50 ${
                      selectedReviews.has(review.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedReviews.has(review.id)}
                        onChange={() => toggleSelection(review.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-slate-900">
                          {review.reviewer_name}
                        </div>
                        <div className="text-xs text-slate-600">
                          {review.reviewer_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
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
                                : 'text-slate-300'
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
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
                    <td className="px-4 py-3 text-slate-700 text-xs">
                      {new Date(review.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      {!review.is_approved && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => approveReview(review.id)}
                          disabled={isLoading}
                        >
                          ✓ Setujui
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteReview(review.id)}
                        disabled={isLoading}
                      >
                        🗑️ Hapus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
