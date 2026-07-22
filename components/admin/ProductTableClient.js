'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'
import BulkActions from '@/components/admin/BulkActions'

export default function ProductTableClient({ products: initialProducts, categories }) {
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStock, setFilterStock] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = useMemo(() => {
    let result = [...products]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p => p.title.toLowerCase().includes(q))
    }
    if (filterType) result = result.filter(p => p.type === filterType)
    if (filterCategory) result = result.filter(p => p.category_id === filterCategory)
    if (filterStatus) result = result.filter(p => filterStatus === 'active' ? p.is_active : !p.is_active)
    if (filterStock) {
      result = result.filter(p => {
        if (filterStock === 'unlimited') return p.stock_type === 'unlimited'
        if (filterStock === 'limited') return p.stock_type === 'limited' && (p.stock_qty || 0) > 0
        if (filterStock === 'sold_out') return p.stock_type === 'limited' && (p.stock_qty || 0) <= 0
        return true
      })
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'judul') cmp = a.title.localeCompare(b.title)
      else if (sortBy === 'download_count') cmp = (a.download_count || 0) - (b.download_count || 0)
      else cmp = new Date(a.created_at || 0) - new Date(b.created_at || 0)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [products, search, filterType, filterCategory, filterStatus, filterStock, sortBy, sortDir])

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('asc') }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleAll = () => {
    setSelectedIds(prev => prev.length === filtered.length ? [] : filtered.map(p => p.id))
  }

  const hasActiveFilters = search || filterType || filterCategory || filterStatus || filterStock

  const clearFilters = () => {
    setSearch(''); setFilterType(''); setFilterCategory(''); setFilterStatus(''); setFilterStock('')
  }

  const togglePublish = (id) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p))
  }

  const handleBulkPublish = () => {
    setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, is_active: true } : p))
    setSelectedIds([])
  }

  const handleBulkUnpublish = () => {
    setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, is_active: false } : p))
    setSelectedIds([])
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Hapus ${selectedIds.length} produk?`)) {
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)))
      setSelectedIds([])
      setConfirmDelete(null)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Hapus produk ini?')) {
      setProducts(prev => prev.filter(p => p.id !== id))
    }
  }

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="text-[#0ea5a0] ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari judul produk..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20">
              <option value="">Semua Tipe</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20">
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20">
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="draft">Draft</option>
            </select>
            <select value={filterStock} onChange={e => setFilterStock(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20">
              <option value="">Semua Stok</option>
              <option value="unlimited">Unlimited</option>
              <option value="limited">Limited</option>
              <option value="sold_out">Sold Out</option>
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{filtered.length} dari {products.length} produk</span>
            <button onClick={clearFilters} className="text-xs text-[#0ea5a0] hover:text-[#0d7a8a] font-semibold">Reset Filter</button>
          </div>
        )}
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
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Cover</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold cursor-pointer select-none" onClick={() => toggleSort('judul')}>
                  Judul <SortIcon field="judul" />
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Kategori</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Tipe</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Harga Jual</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Stok</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold cursor-pointer select-none" onClick={() => toggleSort('download_count')}>
                  Download <SortIcon field="download_count" />
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Kelengkapan</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-sm text-gray-400">
                    Tidak ada produk ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded text-[#0ea5a0] focus:ring-[#0ea5a0]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {product.cover_path ? (
                          <img src={product.cover_path} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/produk/${product.id}/edit`} className="text-sm font-medium text-gray-900 hover:text-[#0ea5a0] transition-colors">
                        {product.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{product.category?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        product.type === 'free'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {product.type === 'free' ? 'Free' : 'Paid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {product.type === 'paid' ? formatRupiah(product.sale_price) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${
                        product.stock_type === 'unlimited'
                          ? 'text-gray-500'
                          : (product.stock_qty || 0) <= 0
                            ? 'text-red-500 font-medium'
                            : 'text-gray-700'
                      }`}>
                        {product.stock_type === 'unlimited' ? '∞ Unlimited' : `${product.stock_qty || 0} tersisa`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublish(product.id)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full transition-colors ${
                          product.is_active
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        }`}
                      >
                        {product.is_active ? 'Aktif' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{product.download_count || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                          product.description ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'
                        }`}>
                          {product.description ? '✓' : '✗'}
                        </span>
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                          product.file_path ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'
                        }`}>
                          {product.file_path ? '✓' : '✗'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/produk/${product.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-[#0ea5a0] transition-colors rounded-lg hover:bg-[#0ea5a0]/5"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
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

      {/* Add Product Button */}
      <div className="flex justify-end">
        <Link
          href="/admin/produk/baru"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Produk
        </Link>
      </div>
    </div>
  )
}
