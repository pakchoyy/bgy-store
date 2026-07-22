'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateSlug } from '@/lib/utils'

export default function PageForm({ initialData }) {
  const router = useRouter()
  const isEditing = !!initialData
  const draftKey = isEditing ? `draft_page_${initialData.id}` : 'draft_page_new'

  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    is_active: true,
    meta_title: '',
    meta_description: '',
    ...initialData,
  })
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savedDraft, setSavedDraft] = useState(false)

  useEffect(() => {
    if (!slugManuallyEdited && !isEditing) {
      setForm(prev => ({ ...prev, slug: generateSlug(form.title) }))
    }
  }, [form.title]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setInterval(() => {
      const data = { ...form, _timestamp: Date.now() }
      localStorage.setItem(draftKey, JSON.stringify(data))
      setSavedDraft(true)
    }, 30000)
    return () => clearInterval(timer)
  }, [form, draftKey])

  useEffect(() => {
    if (!isEditing) {
      try {
        const draft = localStorage.getItem(draftKey)
        if (draft) {
          const parsed = JSON.parse(draft)
          if (parsed.title && window.confirm('Ada draft tersimpan. Pulihkan?')) {
            setForm(prev => ({ ...prev, ...parsed, _timestamp: undefined }))
          }
        }
      } catch {}
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    localStorage.removeItem(draftKey)
    setToast({ type: 'success', message: isEditing ? 'Halaman berhasil diperbarui!' : 'Halaman berhasil disimpan!' })
    setSaving(false)
    setTimeout(() => router.push('/admin/halaman'), 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {toast && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
        }`}>
          {toast.message}
        </div>
      )}
      {savedDraft && (
        <div className="px-4 py-2 bg-blue-50 text-blue-600 text-xs rounded-lg border border-blue-200 flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Draft tersimpan otomatis
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">Informasi Halaman</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Halaman</label>
            <input
              type="text"
              value={form.title}
              onChange={e => updateField('title', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
              placeholder="Masukkan judul halaman"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => { setSlugManuallyEdited(true); updateField('slug', e.target.value) }}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
              placeholder="auto-generated-slug"
              required
            />
            <p className="text-xs text-gray-400 mt-1">URL: /halaman/{form.slug || '...'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konten (HTML)</label>
            <textarea
              value={form.content}
              onChange={e => updateField('content', e.target.value)}
              rows={14}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
              placeholder="<h1>Selamat Datang</h1><p>Tulis konten halaman di sini...</p>"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">Status</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={`relative w-10 h-5 rounded-full transition-colors ${
              form.is_active ? 'bg-[#0ea5a0]' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform shadow-sm ${
                form.is_active ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => updateField('is_active', e.target.checked)}
              className="sr-only"
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {form.is_active ? 'Aktif' : 'Draft'}
          </span>
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">SEO</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
            <input
              type="text"
              value={form.meta_title}
              onChange={e => updateField('meta_title', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
              placeholder="{title} — Bantu Guru Yuk"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
            <textarea
              value={form.meta_description}
              onChange={e => updateField('meta_description', e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
              placeholder="Deskripsi singkat untuk SEO..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
        >
          Batal
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.open(`/halaman/${form.slug}`, '_blank')}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Preview
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : isEditing ? 'Perbarui Halaman' : 'Simpan Halaman'}
          </button>
        </div>
      </div>
    </form>
  )
}
