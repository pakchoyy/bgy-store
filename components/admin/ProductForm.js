'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateSlug, formatRupiah, calcDiscount, CARD_LAYOUTS } from '@/lib/utils'
import FAQEditor from '@/components/admin/FAQEditor'

const BADGE_OPTIONS = [
  { value: 'baru', label: 'Baru' },
  { value: 'terlaris', label: 'Terlaris' },
  { value: 'diskon', label: 'Diskon' },
  { value: 'gratis', label: 'Gratis' },
  { value: 'premium', label: 'Premium' },
]

export default function ProductForm({ initialData, categories = [] }) {
  const router = useRouter()
  const isEditing = !!initialData
  const draftKey = isEditing ? `draft_product_${initialData.id}` : 'draft_product_new'

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    faqs: [],
    category_id: '',
    type: 'free',
    badges: [],
    badge_custom: '',
    is_featured: false,
    sale_price: 0,
    original_price: '',
    stock_type: 'unlimited',
    stock_qty: 1,
    cover_path: initialData?.cover_path || '',
    file_path: initialData?.file_path || '',
    file_url: initialData?.file_url || '',
    file_name: initialData?.file_name || '',
    file_size: initialData?.file_size || '',
    mime_type: initialData?.mime_type || '',
    card_layout: initialData?.card_layout || 'landscape',
    is_active: true,
    meta_title: '',
    meta_description: '',
    ...initialData,
    badges: initialData?.badge ? [initialData.badge] : [],
    sale_price: initialData?.sale_price ?? 0,
    original_price: initialData?.original_price ?? '',
    stock_qty: initialData?.stock_qty ?? 1,
    card_layout: initialData?.card_layout || 'landscape',
  })

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [coverPreview, setCoverPreview] = useState(null)
  const [savedDraft, setSavedDraft] = useState(false)

  useEffect(() => {
    if (!slugManuallyEdited && !isEditing && form.title) {
      setForm(prev => ({ ...prev, slug: generateSlug(form.title) }))
    }
  }, [form.title]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const autoSave = { ...form, _timestamp: Date.now() }
    const timer = setInterval(() => {
      localStorage.setItem(draftKey, JSON.stringify(autoSave))
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
            const { _timestamp, ...rest } = parsed
            setForm(prev => ({ ...prev, ...rest }))
          }
        }
      } catch {}
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleBadge = (badge) => {
    setForm(prev => ({
      ...prev,
      badges: prev.badges.includes(badge)
        ? prev.badges.filter(b => b !== badge)
        : [...prev.badges, badge],
    }))
  }

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const isDemo =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
    const payload = {
      title: form.title,
      slug: form.slug,
      description: form.description,
      category_id: form.category_id || null,
      type: form.type,
      sale_price: Number(form.sale_price) || 0,
      original_price: form.original_price ? Number(form.original_price) : null,
      stock_type: form.stock_type,
      stock_qty: Number(form.stock_qty) || 0,
      badge: form.badges.includes('custom') ? 'custom' : form.badges[0] || null,
      badge_custom: form.badge_custom || null,
      is_featured: form.is_featured,
      cover_path: form.cover_path || null,
      preview_path: form.preview_path || null,
      file_path: form.file_path || null,
      file_url: form.file_url || null,
      file_name: form.file_name || null,
      file_size: form.file_size || null,
      mime_type: form.mime_type || null,
      card_layout: form.card_layout || 'landscape',
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      is_active: form.is_active,
      ...(isEditing ? { id: initialData.id } : {}),
    }
    try {
      const res = await fetch('/api/admin/products', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast('error', (data.error || 'Gagal menyimpan').replace(/[{}"]/g, ''))
      } else {
        showToast('success', isEditing ? 'Produk diperbarui!' : 'Produk berhasil disimpan!')
        if (isDemo && typeof window !== 'undefined') {
          const existing = JSON.parse(localStorage.getItem('_bgym_demo_products') || '[]')
          const next = isEditing
            ? existing.map((p) => (p.id === initialData.id ? { ...p, ...payload, id: p.id } : p))
            : [...existing, { ...payload, id: 'demo-' + Date.now(), is_active: true }]
          localStorage.setItem('_bgym_demo_products', JSON.stringify(next))
        }
        localStorage.removeItem(draftKey)
        setTimeout(() => router.push('/admin/produk'), 1000)
      }
    } catch (e) {
      showToast('error', e.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const discount = calcDiscount(form.original_price, form.sale_price)

  const handlePreview = () => {
    const slug = form.slug || generateSlug(form.title)
    if (slug) window.open(`/produk/${slug}`, '_blank')
  }

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverPreview(URL.createObjectURL(file))
      updateField('cover_path', URL.createObjectURL(file))
    }
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

      {/* Identitas */}
      <CardSection title="Identitas Produk">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Produk</label>
          <input
            type="text"
            value={form.title}
            onChange={e => updateField('title', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
            placeholder="Masukkan judul produk"
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
          <p className="text-xs text-gray-400 mt-1">URL: /produk/{form.slug || '...'}</p>
        </div>
      </CardSection>

      {/* Konten */}
      <CardSection title="Konten">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            rows={6}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
            placeholder="Tulis deskripsi produk (HTML didukung)..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">FAQ</label>
          <FAQEditor faqs={form.faqs} onChange={val => updateField('faqs', val)} />
        </div>
      </CardSection>

      {/* Klasifikasi */}
      <CardSection title="Klasifikasi">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={form.category_id}
              onChange={e => updateField('category_id', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
            >
              <option value="">Pilih kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="free"
                  checked={form.type === 'free'}
                  onChange={e => updateField('type', e.target.value)}
                  className="text-[#0ea5a0] focus:ring-[#0ea5a0]"
                />
                <span className="text-sm font-medium text-gray-700">Free</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="paid"
                  checked={form.type === 'paid'}
                  onChange={e => updateField('type', e.target.value)}
                  className="text-[#0ea5a0] focus:ring-[#0ea5a0]"
                />
                <span className="text-sm font-medium text-gray-700">Paid</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
          <div className="flex flex-wrap gap-2">
            {BADGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleBadge(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  form.badges.includes(opt.value)
                    ? 'bg-[#0ea5a0] text-white border-[#0ea5a0] shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <input
              type="text"
              value={form.badge_custom}
              onChange={e => updateField('badge_custom', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
              placeholder="Custom badge (opsional)"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={e => updateField('is_featured', e.target.checked)}
              className="rounded text-[#0ea5a0] focus:ring-[#0ea5a0]"
            />
            <span className="text-sm font-medium text-gray-700">Produk Unggulan</span>
          </label>
        </div>
      </CardSection>

      {/* Harga */}
      {form.type === 'paid' && (
        <CardSection title="Harga">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual (Rp)</label>
              <input
                type="number"
                value={form.sale_price}
                onChange={e => updateField('sale_price', parseInt(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Asli (Rp) — opsional</label>
              <input
                type="number"
                value={form.original_price}
                onChange={e => updateField('original_price', e.target.value ? parseInt(e.target.value) : '')}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
                min="0"
                placeholder="Contoh: 50000"
              />
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-1">Pratinjau Harga</p>
            <p className="text-2xl font-bold text-gray-900">{formatRupiah(form.sale_price)}</p>
            {discount.showDiscount && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm line-through text-gray-400">{formatRupiah(form.original_price)}</span>
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Hemat {formatRupiah(discount.saving)} ({discount.percent}%)
                </span>
              </div>
            )}
          </div>
        </CardSection>
      )}

      {/* Stok */}
      <CardSection title="Stok">
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="stock_type"
              value="unlimited"
              checked={form.stock_type === 'unlimited'}
              onChange={e => updateField('stock_type', e.target.value)}
              className="text-[#0ea5a0] focus:ring-[#0ea5a0]"
            />
            <span className="text-sm font-medium text-gray-700">Unlimited</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="stock_type"
              value="limited"
              checked={form.stock_type === 'limited'}
              onChange={e => updateField('stock_type', e.target.value)}
              className="text-[#0ea5a0] focus:ring-[#0ea5a0]"
            />
            <span className="text-sm font-medium text-gray-700">Limited</span>
          </label>
        </div>
        {form.stock_type === 'limited' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Stok</label>
            <input
              type="number"
              value={form.stock_qty}
              onChange={e => updateField('stock_qty', parseInt(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
              min="0"
            />
            {initialData?.stock_type === 'limited' && (
              <p className="text-xs text-gray-400 mt-1">Stok saat ini: {initialData.stock_qty}</p>
            )}
          </div>
        )}
      </CardSection>

      {/* Tata Letak Blok */}
      <CardSection title="Tata Letak Blok">
        <p className="text-xs text-gray-500 -mt-2 mb-2">
          Bentuk kartu produk di halaman toko (per produk)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CARD_LAYOUTS.map((layout) => {
            const active = form.card_layout === layout.value
            return (
              <button
                key={layout.value}
                type="button"
                onClick={() => updateField('card_layout', layout.value)}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  active
                    ? 'border-[#0ea5a0] bg-teal-50 ring-2 ring-[#0ea5a0]/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="h-12 mb-2 flex items-end justify-center gap-1">
                  {layout.value === 'compact' ? (
                    <div className="w-full h-6 rounded bg-gray-300" />
                  ) : layout.value === 'square' ? (
                    <div className="w-10 h-10 rounded bg-gray-300" />
                  ) : layout.value === 'portrait' ? (
                    <div className="w-8 h-11 rounded bg-gray-300" />
                  ) : layout.value === 'wide' ? (
                    <div className="w-full h-5 rounded bg-gray-300" />
                  ) : (
                    <div className="w-full h-8 rounded bg-gray-300" />
                  )}
                </div>
                <p className={`text-[11px] font-bold ${active ? 'text-[#0ea5a0]' : 'text-gray-700'}`}>
                  {layout.label}
                </p>
              </button>
            )
          })}
        </div>
      </CardSection>

      {/* Media */}
      <CardSection title="Media">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover</label>
            <label className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#0ea5a0] transition-colors cursor-pointer block">
              {coverPreview ? (
                <img src={coverPreview} alt="Preview" className="max-h-32 mx-auto rounded" />
              ) : form.cover_path ? (
                <img src={form.cover_path} alt="Cover" className="max-h-32 mx-auto rounded" />
              ) : (
                <div>
                  <svg className="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-400 mt-2">Klik untuk upload cover</p>
                  <p className="text-xs text-gray-300 mt-1">JPG, PNG, WebP</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File Produk</label>
            <label className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#0ea5a0] transition-colors cursor-pointer block">
              {form.file_path ? (
                <div>
                  <svg className="w-8 h-8 mx-auto text-[#0ea5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-[#0ea5a0] font-medium mt-2">Ganti File</p>
                  <p className="text-xs text-gray-400 mt-1">{form.file_size || 'File tersimpan'}</p>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-400 mt-2">Klik untuk upload file</p>
                  <p className="text-xs text-gray-300 mt-1">PDF, ZIP, DOC, XLS (max 50MB)</p>
                </div>
              )}
              <input type="file" onChange={e => {
                const f = e.target.files?.[0]
                if (f) {
                  updateField('file_path', f.name)
                  updateField('file_size', `${(f.size / 1024 / 1024).toFixed(1)} MB`)
                }
              }} className="hidden" />
            </label>
          </div>
        </div>
      </CardSection>

      {/* Publish */}
      <CardSection title="Publikasi">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-[#0ea5a0]' : 'bg-gray-300'}`}>
            <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform shadow-sm ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            <input type="checkbox" checked={form.is_active} onChange={e => updateField('is_active', e.target.checked)} className="sr-only" />
          </div>
          <span className="text-sm font-medium text-gray-700">{form.is_active ? 'Aktif' : 'Draft'}</span>
        </label>
      </CardSection>

      {/* SEO */}
      <CardSection title="SEO">
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
      </CardSection>

      {/* Actions */}
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
            onClick={handlePreview}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Preview
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? 'Menyimpan...' : isEditing ? 'Perbarui Produk' : 'Simpan Produk'}
          </button>
        </div>
      </div>
    </form>
  )
}

function CardSection({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
