'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import BulkActions from '@/components/admin/BulkActions'

export default function PageTableClient({ pages: initialPages }) {
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

  const togglePublish = (id) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p))
  }

  const handleBulkPublish = () => {
    setPages(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, is_active: true } : p))
    setSelectedIds([])
  }

  const handleBulkUnpublish = () => {
    setPages(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, is_active: false } : p))
    setSelectedIds([])
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Hapus ${selectedIds.length} halaman?`)) {
      setPages(prev => prev.filter(p => !selectedIds.includes(p.id)))
      setSelectedIds([])
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Hapus halaman ini?')) {
      setPages(prev => prev.filter(p => p.id !== id))
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
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari judul atau slug..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
            />
          </div>
          <Link
            href="/admin/halaman/baru"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Halaman
          </Link>
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
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded text-[#0ea5a0] focus:ring-[#0ea5a0]"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Judul</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Slug</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Terakhir Diperbarui</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    Tidak ada halaman ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map(page => (
                  <tr key={page.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(page.id)}
                        onChange={() => toggleSelect(page.id)}
                        className="rounded text-[#0ea5a0] focus:ring-[#0ea5a0]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/halaman/${page.id}/edit`}
                        className="text-sm font-medium text-gray-900 hover:text-[#0ea5a0] transition-colors"
                      >
                        {page.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{page.slug}</code>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublish(page.id)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full transition-colors ${
                          page.is_active
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        }`}
                      >
                        {page.is_active ? 'Aktif' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(page.updated_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/halaman/${page.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-[#0ea5a0] transition-colors rounded-lg hover:bg-[#0ea5a0]/5"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/halaman/${page.slug}`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-[#0ea5a0] transition-colors rounded-lg hover:bg-[#0ea5a0]/5"
                          title="Lihat"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(page.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                          title="Hapus"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
