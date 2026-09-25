'use client'

import { useMemo, useRef, useState } from 'react'
import useUnsavedChanges from '@/lib/use-unsaved-changes'
import { useRouter } from 'next/navigation'
import { uploadMedia } from '@/lib/upload-media'
import { useToast } from '@/components/ui/toast'

const BLOCK_META = {
  hero: { icon: 'H', label: 'Hero', color: 'bg-teal-100 text-teal-700' },
  featured_products: { icon: '★', label: 'Produk Unggulan', color: 'bg-amber-100 text-amber-700' },
  categories: { icon: '☰', label: 'Kategori', color: 'bg-violet-100 text-violet-700' },
  free_products: { icon: '↓', label: 'Produk Gratis', color: 'bg-sky-100 text-sky-700' },
  promo_banner: { icon: '!', label: 'Promo Banner', color: 'bg-rose-100 text-rose-700' },
  about: { icon: 'i', label: 'Tentang', color: 'bg-gray-100 text-gray-700' },
}

function cloneSections(list) {
  return list.map((s) => ({
    ...s,
    config: { ...(s.config || {}) },
  }))
}

export default function HomepageBuilder({ initialSections, products = [], categories = [], siteName = 'BGY' }) {
  const router = useRouter()
  const { addToast } = useToast()
  const [sections, setSections] = useState(() => cloneSections(initialSections))
  const [selectedId, setSelectedId] = useState(initialSections[0]?.id || null)
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const pending = useRef(false)
  const [saving, setSaving] = useState(false)
  const {dirty, markSaved} = useUnsavedChanges(sections)

  const selected = useMemo(
    () => sections.find((s) => s.id === selectedId) || null,
    [sections, selectedId]
  )

  const visibleSections = useMemo(
    () => sections.filter((s) => s.is_visible).sort((a, b) => a.sort_order - b.sort_order),
    [sections]
  )

  const featured = products.filter((p) => p.is_featured).slice(0, 3)
  const free = products.filter((p) => p.type === 'free').slice(0, 3)

  function reorder(fromId, toId) {
    if (pending.current) return
    if (!fromId || !toId || fromId === toId) return
    setSections((prev) => {
      const next = [...prev].sort((a, b) => a.sort_order - b.sort_order)
      const fromIdx = next.findIndex((s) => s.id === fromId)
      const toIdx = next.findIndex((s) => s.id === toId)
      if (fromIdx < 0 || toIdx < 0) return prev
      const [item] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, item)
      return next.map((s, i) => ({ ...s, sort_order: i + 1 }))
    })
  }

  function toggleVisible(id) {
    if (pending.current) return
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_visible: !s.is_visible } : s))
    )
  }

  function updateConfig(key, value) {
    if (pending.current) return
    if (!selectedId) return
    setSections((prev) =>
      prev.map((s) =>
        s.id === selectedId
          ? { ...s, config: { ...(s.config || {}), [key]: value } }
          : s
      )
    )
  }

  function updateLabel(value) {
    if (pending.current) return
    if (!selectedId) return
    setSections((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, label: value } : s))
    )
  }

  async function handleSave() {
    if (pending.current) return
    pending.current = true
    setToast(null)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: sections.map((s, i) => ({
            id: s.id,
            key: s.key,
            label: s.label,
            is_visible: s.is_visible,
            sort_order: i + 1,
            config: s.config || {},
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        addToast(data.error || 'Gagal menyimpan', 'error')
      } else if (Array.isArray(data.sections)) {
        setSections(data.sections)
        markSaved(data.sections)
        addToast('Semua perubahan halaman depan tersimpan!', 'success')
        router.refresh()
      } else { addToast('Server belum mengonfirmasi penyimpanan. Silakan coba lagi.', 'error') }
    } catch (e) {
      addToast(e.message || 'Gagal menyimpan', 'error')
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return (
    <fieldset disabled={saving} aria-busy={saving} className="space-y-4 min-w-0">
      {dirty && <p role="status" className="text-sm text-slate-600">Ada perubahan halaman depan yang belum disimpan.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">Homepage Builder</h1>
          <p className="text-sm text-gray-500">Drag blok, edit, lihat preview HP realtime</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            className="text-sm font-semibold text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Lihat Website
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-bold px-5 py-2 rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        {/* LEFT: blocks + editor */}
        <div className="space-y-4 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">Block List</h2>
              <span className="text-xs text-gray-400">{sections.length} blok</span>
            </div>
            <div className="space-y-2">
              {[...sections]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((section) => {
                  const meta = BLOCK_META[section.key] || {
                    icon: '•',
                    label: section.label,
                    color: 'bg-gray-100 text-gray-600',
                  }
                  const active = selectedId === section.id
                  const isOver = overId === section.id && dragId !== section.id
                  return (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => setDragId(section.id)}
                      onDragEnd={() => {
                        setDragId(null)
                        setOverId(null)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setOverId(section.id)
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        reorder(dragId, section.id)
                        setDragId(null)
                        setOverId(null)
                      }}
                      onClick={() => setSelectedId(section.id)}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 cursor-pointer transition-all ${
                        active
                          ? 'border-[#0ea5a0] bg-[rgba(14,165,160,0.06)] shadow-sm'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      } ${isOver ? 'ring-2 ring-[#0ea5a0]/30' : ''} ${
                        dragId === section.id ? 'opacity-50' : ''
                      }`}
                    >
                      <span className="text-gray-300 cursor-grab active:cursor-grabbing select-none text-lg leading-none">
                        ⠿
                      </span>
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${meta.color}`}
                      >
                        {meta.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {section.label}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono truncate">
                          {section.key}
                        </p>
                      </div>
                      <button type="button" aria-label={`Naikkan ${section.label}`} disabled={saving || sections[0]?.id === section.id} onClick={event=>{event.stopPropagation();const index=sections.findIndex(s=>s.id===section.id);reorder(section.id,sections[index-1]?.id);}} className="min-h-11 min-w-11 rounded-lg border disabled:opacity-30">↑</button>
                      <button type="button" aria-label={`Turunkan ${section.label}`} disabled={saving || sections[sections.length-1]?.id === section.id} onClick={event=>{event.stopPropagation();const index=sections.findIndex(s=>s.id===section.id);reorder(section.id,sections[index+1]?.id);}} className="min-h-11 min-w-11 rounded-lg border disabled:opacity-30">↓</button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleVisible(section.id)
                        }}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                          section.is_visible
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {section.is_visible ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  )
                })}
            </div>
          </div>

          {selected && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">Edit Block</h2>
                <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">
                  {selected.key}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Nama bagian (untuk admin)</label>
                <input
                  value={selected.label || ''}
                  onChange={(e) => updateLabel(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]"
                />
              </div>

              {selected.key === 'hero' && (
                <>
                  <Field
                    label="Nama tampilan"
                    value={selected.config?.display_name || selected.config?.title || ''}
                    onChange={(v) => updateConfig('display_name', v)}
                  />
                  <Field
                    label="Handle / username"
                    value={selected.config?.handle || ''}
                    onChange={(v) => updateConfig('handle', v)}
                    placeholder="@bgy"
                  />
                  <Field
                    label="About singkat"
                    value={selected.config?.about || selected.config?.subtitle || ''}
                    onChange={(v) => updateConfig('about', v)}
                    multiline
                  />
                  <UploadField
                    label="Avatar / logo profil"
                    value={selected.config?.avatar_url || ''}
                    onChange={(v) => updateConfig('avatar_url', v)}
                  />
                  <UploadField
                    label="Banner background"
                    value={selected.config?.banner_url || ''}
                    onChange={(v) => updateConfig('banner_url', v)}
                  />
                  <Field
                    label="Judul SEO / fallback"
                    value={selected.config?.title || ''}
                    onChange={(v) => updateConfig('title', v)}
                  />
                  <Field
                    label="Subtitle"
                    value={selected.config?.subtitle || ''}
                    onChange={(v) => updateConfig('subtitle', v)}
                    multiline
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="CTA Text"
                      value={selected.config?.cta_text || ''}
                      onChange={(v) => updateConfig('cta_text', v)}
                    />
                    <Field
                      label="CTA URL"
                      value={selected.config?.cta_url || ''}
                      onChange={(v) => updateConfig('cta_url', v)}
                    />
                  </div>
                </>
              )}

              {selected.key === 'promo_banner' && (
                <>
                  <UploadField
                    label="Gambar banner promo"
                    value={selected.config?.image_url || ''}
                    onChange={(v) => updateConfig('image_url', v)}
                  />
                  <Field
                    label="Teks Banner"
                    value={selected.config?.text || ''}
                    onChange={(v) => updateConfig('text', v)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="CTA Text"
                      value={selected.config?.cta_text || ''}
                      onChange={(v) => updateConfig('cta_text', v)}
                    />
                    <Field
                      label="CTA URL"
                      value={selected.config?.cta_url || ''}
                      onChange={(v) => updateConfig('cta_url', v)}
                    />
                  </div>
                </>
              )}

              {selected.key === 'about' && (
                <>
                  <Field
                    label="Judul"
                    value={selected.config?.title || ''}
                    onChange={(v) => updateConfig('title', v)}
                  />
                  <Field
                    label="Konten"
                    value={selected.config?.content || ''}
                    onChange={(v) => updateConfig('content', v)}
                    multiline
                  />
                </>
              )}

              {['featured_products', 'categories', 'free_products'].includes(selected.key) && (
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-500">
                  Konten otomatis dari database (produk / kategori aktif).
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: phone preview */}
        <div className="xl:sticky xl:top-16">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Page Preview
          </div>
          <div className="mx-auto w-[300px]">
            <div className="relative rounded-[2.2rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-gray-900 rounded-b-2xl z-20" />
              <div className="h-[560px] bg-[#f4fbfa] overflow-y-auto scrollbar-thin">
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400">☰</span>
                  <span className="text-xs font-extrabold text-gray-800">Home</span>
                  <span className="text-[10px] text-gray-400">⌕</span>
                </div>

                {visibleSections.length === 0 && (
                  <div className="p-8 text-center text-xs text-gray-400">
                    Tidak ada blok aktif
                  </div>
                )}

                {visibleSections.map((section) => (
                  <PreviewBlock
                    key={section.id}
                    section={section}
                    siteName={siteName}
                    featured={featured}
                    free={free}
                    categories={categories}
                    active={selectedId === section.id}
                    onClick={() => setSelectedId(section.id)}
                  />
                ))}
              </div>
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-3">
              Klik blok di preview untuk edit · Drag list kiri untuk urutkan
            </p>
          </div>
        </div>
      </div>
    </fieldset>
  )
}

function Field({ label, value, onChange, multiline, placeholder = '' }) {
  const cls =
    'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]'
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} resize-y`}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
    </div>
  )
}

function UploadField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function chooseFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const media = await uploadMedia(file, 'cover')
      onChange(media.url)
    } catch (err) {
      setError(err.message || 'Upload gagal. Coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        {value ? (
          <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url("${value}")` }} />
          </div>
        ) : (
          <div className="mb-3 flex h-24 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-xs text-gray-400">
            Belum ada gambar
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-[#0d7a8a] px-4 py-2 text-sm font-semibold text-white">
            {uploading ? 'Mengunggah...' : 'Upload gambar'}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile} disabled={uploading} className="sr-only" />
          </label>
          {value && (
            <button type="button" onClick={() => onChange('')} className="min-h-11 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
              Hapus
            </button>
          )}
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
        {value && <p className="mt-2 break-all text-[11px] text-gray-500">{value}</p>}
      </div>
    </div>
  )
}

function PreviewBlock({ section, siteName, featured, free, categories, active, onClick }) {
  const ring = active ? 'ring-2 ring-[#0ea5a0] ring-offset-1' : ''
  const c = section.config || {}

  if (section.key === 'hero') {
    const displayName = c.display_name || c.title || 'Bantu Guru Yuk'
    const about = c.about || c.subtitle
    const handle = c.handle
    return (
      <button type="button" onClick={onClick} className={`w-full text-left ${ring}`}>
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0ea5a0] to-[#0d7a8a] px-4 py-6 text-center text-white">
          {c.banner_url && <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url("${c.banner_url}")` }} />}
          <div className="relative">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-white/20 text-xs font-extrabold">
            {c.avatar_url ? <span className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${c.avatar_url}")` }} aria-hidden="true" /> : displayName?.slice(0, 3)?.toUpperCase() || 'BGY'}
          </div>
          <p className="text-sm font-extrabold leading-snug">
            {displayName}
          </p>
          {handle && <p className="mt-1 text-[10px] font-semibold text-white/75">{handle}</p>}
          {about && (
            <p className="text-[10px] text-white/80 mt-1.5 leading-relaxed line-clamp-3">
              {about}
            </p>
          )}
          {c.cta_text && (
            <span className="inline-block mt-3 bg-white text-[#0ea5a0] text-[10px] font-bold px-3 py-1.5 rounded-lg">
              {c.cta_text}
            </span>
          )}
          </div>
        </div>
      </button>
    )
  }

  if (section.key === 'promo_banner') {
    return (
      <button type="button" onClick={onClick} className={`w-full text-left px-3 py-2 ${ring}`}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-2.5 text-white">
          {c.image_url && <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url("${c.image_url}")` }} />}
          <div className="relative">
          <p className="text-[11px] font-bold leading-snug">{c.text || 'Promo spesial!'}</p>
          {c.cta_text && (
            <span className="text-[10px] underline mt-1 inline-block">{c.cta_text}</span>
          )}
          </div>
        </div>
      </button>
    )
  }

  if (section.key === 'about') {
    return (
      <button type="button" onClick={onClick} className={`w-full text-left px-3 py-3 ${ring}`}>
        <p className="text-xs font-extrabold text-gray-900 mb-1">{c.title || 'Tentang Kami'}</p>
        <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-4">
          {c.content || 'Deskripsi singkat toko...'}
        </p>
      </button>
    )
  }

  if (section.key === 'categories') {
    return (
      <button type="button" onClick={onClick} className={`w-full text-left px-3 py-3 ${ring}`}>
        <p className="text-xs font-extrabold text-gray-900 mb-2">Kategori</p>
        <div className="flex flex-wrap gap-1.5">
          {(categories.length ? categories : [{ name: 'Modul', color: '#0ea5a0' }, { name: 'ATP', color: '#8b5cf6' }])
            .slice(0, 5)
            .map((cat, i) => (
              <span
                key={cat.id || i}
                className="text-[9px] font-bold px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: cat.color || '#0ea5a0' }}
              >
                {cat.name}
              </span>
            ))}
        </div>
      </button>
    )
  }

  if (section.key === 'featured_products' || section.key === 'free_products') {
    const list = section.key === 'featured_products' ? featured : free
    const title = section.key === 'featured_products' ? 'Produk Unggulan' : 'Gratis'
    const fallback = [
      { title: 'Contoh produk 1', sale_price: section.key === 'free' ? 0 : 35000 },
      { title: 'Contoh produk 2', sale_price: section.key === 'free' ? 0 : 45000 },
    ]
    const items = list.length ? list : fallback
    return (
      <button type="button" onClick={onClick} className={`w-full text-left px-3 py-3 ${ring}`}>
        <p className="text-xs font-extrabold text-gray-900 mb-2">{title}</p>
        <div className="space-y-2">
          {items.slice(0, 3).map((p, i) => (
            <div key={p.id || i} className="flex gap-2 bg-white rounded-lg border border-gray-100 p-2">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-teal-100 to-teal-200 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-800 line-clamp-2 leading-snug">
                  {p.title}
                </p>
                <p className="text-[9px] font-bold text-[#0ea5a0] mt-0.5">
                  {p.sale_price === 0 || p.type === 'free'
                    ? 'GRATIS'
                    : `Rp ${(p.sale_price || 0).toLocaleString('id-ID')}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </button>
    )
  }

  return (
    <button type="button" onClick={onClick} className={`w-full text-left px-3 py-3 ${ring}`}>
      <p className="text-xs font-semibold text-gray-700">{section.label}</p>
    </button>
  )
}
