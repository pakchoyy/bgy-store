'use client'

import { useState } from 'react'
import { generateSlug } from '@/lib/utils'
import QuickEdit from '@/components/admin/QuickEdit'

const DEFAULT_COLORS = ['#0ea5a0', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#ec4899', '#6b7280']

export default function KategoriManager({ categories: initialCategories }) {
  const [categories, setCategories] = useState(initialCategories)
  const [editing, setEditing] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', color: '#0ea5a0', sort_order: categories.length + 1 })
  const [toast, setToast] = useState(null)

  const handleSave = (id, field, value) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
    setEditing(null)
    setToast({ type: 'success', message: 'Kategori diperbarui!' })
    setTimeout(() => setToast(null), 2000)
  }

  const handleAdd = () => {
    if (!newCategory.name.trim()) return
    const id = `cat-${Date.now()}`
    setCategories(prev => [...prev, {
      id,
      name: newCategory.name,
      slug: newCategory.slug || generateSlug(newCategory.name),
      color: newCategory.color,
      sort_order: newCategory.sort_order,
    }])
    setNewCategory({ name: '', slug: '', color: '#0ea5a0', sort_order: categories.length + 2 })
    setShowAddForm(false)
    setToast({ type: 'success', message: 'Kategori ditambahkan!' })
    setTimeout(() => setToast(null), 2000)
  }

  const handleDelete = (id) => {
    const cat = categories.find(c => c.id === id)
    if (cat && (cat.product_count || 0) > 0) {
      alert(`Tidak dapat menghapus "${cat.name}" karena masih memiliki ${cat.product_count} produk aktif.`)
      return
    }
    if (window.confirm(`Hapus kategori "${cat?.name}"?`)) {
      setCategories(prev => prev.filter(c => c.id !== id))
      setToast({ type: 'success', message: 'Kategori dihapus!' })
      setTimeout(() => setToast(null), 2000)
    }
  }

  const moveUp = (index) => {
    if (index === 0) return
    setCategories(prev => {
      const updated = [...prev]
      const temp = { ...updated[index], sort_order: updated[index - 1].sort_order }
      updated[index] = { ...updated[index - 1], sort_order: updated[index].sort_order }
      updated[index - 1] = temp
      return updated
    })
  }

  const moveDown = (index) => {
    if (index >= categories.length - 1) return
    setCategories(prev => {
      const updated = [...prev]
      const temp = { ...updated[index], sort_order: updated[index + 1].sort_order }
      updated[index] = { ...updated[index + 1], sort_order: updated[index].sort_order }
      updated[index + 1] = temp
      return updated
    })
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium">
          {toast.message}
        </div>
      )}

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Kategori
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-card p-5 border border-[#0ea5a0]/20">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Kategori Baru</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={e => setNewCategory(prev => ({ ...prev, name: e.target.value, slug: generateSlug(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20"
                placeholder="Nama kategori"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={newCategory.slug}
                onChange={e => setNewCategory(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20"
                placeholder="slug-kategori"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warna Badge</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={e => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-mono">{newCategory.color}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Urutan</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Nama</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Slug</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Warna Badge</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Jumlah Produk</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    Belum ada kategori
                  </td>
                </tr>
              ) : (
                categories.map((cat, index) => (
                  <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <span className="text-sm text-gray-500 w-6 text-center">{cat.sort_order}</span>
                        <button
                          onClick={() => moveDown(index)}
                          disabled={index >= categories.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <span className="text-gray-300 cursor-grab select-none ml-1">⠿</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editing === `name-${cat.id}` ? (
                        <QuickEdit
                          value={cat.name}
                          field="name"
                          onSave={(field, value) => handleSave(cat.id, field, value)}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setEditing(`name-${cat.id}`)}
                          className="text-sm font-medium text-gray-900 hover:text-[#0ea5a0] transition-colors text-left"
                        >
                          {cat.name}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editing === `slug-${cat.id}` ? (
                        <QuickEdit
                          value={cat.slug}
                          field="slug"
                          onSave={(field, value) => handleSave(cat.id, field, value)}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setEditing(`slug-${cat.id}`)}
                          className="text-xs font-mono text-gray-500 hover:text-[#0ea5a0] transition-colors bg-gray-50 px-2 py-1 rounded"
                        >
                          {cat.slug}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={cat.color}
                          onChange={e => handleSave(cat.id, 'color', e.target.value)}
                          className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500 font-mono">{cat.color}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{cat.product_count || 0}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
