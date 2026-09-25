'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import BulkActions from '@/components/admin/BulkActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'

export default function PageTableClient({ pages: initialPages }) {
  const { addToast } = useToast()
  const [pages, setPages] = useState(initialPages)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  const filtered = useMemo(() => {
    if (!search) return pages
    const q = search.toLowerCase()
    return pages.filter(p => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
  }, [pages, search])

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleAll = () => {
    setSelectedIds(prev => prev.length === filtered.length ? [] : filtered.map(p => p.id))
  }

  const setPublishState = async (ids, is_active) => {
    const prevPages = pages
    setPages(prev => prev.map(p => ids.includes(p.id) ? { ...p, is_active } : p))
    try {
      const response = await fetch('/api/admin/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, is_active }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Gagal mengubah status')
    } catch (e) {
      setPages(prevPages)
      addToast(e.message, 'error')
    }
  }

  const togglePublish = (id) => {
    const page = pages.find(p => p.id === id)
    setPublishState([id], !page.is_active)
  }

  const handleBulkPublish = () => {
    setPublishState(selectedIds, true)
    setSelectedIds([])
  }

  const handleBulkUnpublish = () => {
    setPublishState(selectedIds, false)
    setSelectedIds([])
  }

  const deleteIds = async (ids) => {
    const prevPages = pages
    setPages(prev => prev.filter(p => !ids.includes(p.id)))
    try {
      const response = await fetch(`/api/admin/pages?ids=${ids.map(encodeURIComponent).join(',')}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Gagal menghapus halaman')
    } catch (e) {
      setPages(prevPages)
      addToast(e.message, 'error')
    }
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Hapus ${selectedIds.length} halaman?`)) {
      deleteIds(selectedIds)
      setSelectedIds([])
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Hapus halaman ini?')) {
      deleteIds([id])
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      {/* Search & Action Bar */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari judul atau slug..."
            />
          </div>
          <Button asChild>
            <Link href="/admin/halaman/baru">
              ➕ Tambah Halaman
            </Link>
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedIds={selectedIds}
        actions={[
          { label: 'Terbitkan', onClick: handleBulkPublish },
          { label: 'Tarik', onClick: handleBulkUnpublish },
          { label: 'Hapus', onClick: handleBulkDelete, danger: true },
        ]}
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-left">
                  <Checkbox
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600 font-semibold">Judul</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600 font-semibold">Slug</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600 font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600 font-semibold">Terakhir Diperbarui</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    Tidak ada halaman ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map(page => (
                  <tr key={page.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedIds.includes(page.id)}
                        onChange={() => toggleSelect(page.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/halaman/${page.id}/edit`}
                        className="text-sm font-medium text-slate-900 hover:text-teal-600 transition-colors"
                      >
                        {page.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{page.slug}</code>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublish(page.id)}
                        className={page.is_active ? 'text-green-600 hover:bg-green-50' : 'text-yellow-600 hover:bg-yellow-50'}
                      >
                        {page.is_active ? 'Aktif' : 'Draft'}
                      </Button>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(page.updated_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="Edit"
                        >
                          <Link href={`/admin/halaman/${page.id}/edit`}>
                            ✏️
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="Lihat"
                        >
                          <Link href={`/halaman/${page.slug}`} target="_blank">
                            👁️
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(page.id)}
                          className="text-red-600 hover:bg-red-50"
                          title="Hapus"
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
