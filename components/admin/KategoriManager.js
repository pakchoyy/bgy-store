'use client'

import { useState } from 'react'
import { generateSlug } from '@/lib/utils'
import QuickEdit from '@/components/admin/QuickEdit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'

const DEFAULT_COLORS = ['#0ea5a0', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#ec4899', '#6b7280']

export default function KategoriManager({ categories: initialCategories }) {
  const { addToast } = useToast()
  const [categories, setCategories] = useState(initialCategories)
  const [editing, setEditing] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', color: '#0ea5a0', sort_order: categories.length + 1 })

  const showToast = (type, message) => {
    addToast(message, type)
  }

  const handleSave = async (id, field, value) => {
    const prevCategories = categories
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
    setEditing(null)
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan kategori')
      showToast('success', 'Kategori diperbarui!')
    } catch (e) {
      setCategories(prevCategories)
      showToast('error', e.message)
    }
  }

  const handleAdd = async () => {
    if (!newCategory.name.trim()) return
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategory.name,
          slug: newCategory.slug || generateSlug(newCategory.name),
          color: newCategory.color,
          sort_order: newCategory.sort_order,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Gagal menambah kategori')
      setCategories(prev => [...prev, data.category])
      setNewCategory({ name: '', slug: '', color: '#0ea5a0', sort_order: categories.length + 2 })
      setShowAddForm(false)
      showToast('success', 'Kategori ditambahkan!')
    } catch (e) {
      showToast('error', e.message)
    }
  }

  const handleDelete = async (id) => {
    const cat = categories.find(c => c.id === id)
    if (cat && (cat.product_count || 0) > 0) {
      alert(`Tidak dapat menghapus "${cat.name}" karena masih memiliki ${cat.product_count} produk aktif.`)
      return
    }
    if (!window.confirm(`Hapus kategori "${cat?.name}"?`)) return
    try {
      const response = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Gagal menghapus kategori')
      setCategories(prev => prev.filter(c => c.id !== id))
      showToast('success', 'Kategori dihapus!')
    } catch (e) {
      showToast('error', e.message)
    }
  }

  const swapOrder = async (index, otherIndex) => {
    const a = categories[index]
    const b = categories[otherIndex]
    const prevCategories = categories
    const updated = [...categories]
    updated[index] = { ...b, sort_order: a.sort_order }
    updated[otherIndex] = { ...a, sort_order: b.sort_order }
    setCategories(updated)
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: [
            { id: a.id, sort_order: b.sort_order },
            { id: b.id, sort_order: a.sort_order },
          ],
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Gagal mengubah urutan')
    } catch (e) {
      setCategories(prevCategories)
      showToast('error', e.message)
    }
  }

  const moveUp = (index) => {
    if (index === 0) return
    swapOrder(index, index - 1)
  }

  const moveDown = (index) => {
    if (index >= categories.length - 1) return
    swapOrder(index, index + 1)
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(true)}>
          + Tambah Kategori
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Kategori Baru</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nama</label>
                <Input
                  type="text"
                  value={newCategory.name}
                  onChange={e => setNewCategory(prev => ({ ...prev, name: e.target.value, slug: generateSlug(e.target.value) }))}
                  placeholder="Nama kategori"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Slug</label>
                <Input
                  type="text"
                  value={newCategory.slug}
                  onChange={e => setNewCategory(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="slug-kategori"
                  className="font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Warna Badge</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={e => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                    className="w-10 h-10 rounded border border-slate-200 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono">{newCategory.color}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Batal
              </Button>
              <Button onClick={handleAdd}>
                Simpan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-600 font-semibold">Urutan</th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-600 font-semibold">Nama</th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-600 font-semibold">Slug</th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-600 font-semibold">Warna Badge</th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-600 font-semibold">Jumlah Produk</th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-600 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    Belum ada kategori
                  </td>
                </tr>
              ) : (
                categories.map((cat, index) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          ↑
                        </Button>
                        <span className="text-sm text-slate-600 w-6 text-center">{cat.sort_order}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveDown(index)}
                          disabled={index >= categories.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          ↓
                        </Button>
                        <span className="text-slate-300 cursor-grab select-none ml-1 text-sm">⠿</span>
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
                          className="text-xs font-mono text-slate-500 hover:text-teal-600 transition-colors bg-slate-50 px-2 py-1 rounded"
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
                    <td className="px-6 py-4 text-sm text-slate-700">{cat.product_count || 0}</td>
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Hapus"
                      >
                        🗑️
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
