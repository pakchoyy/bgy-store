'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'
import AdminToast from '@/components/admin/AdminToast'

function priceLabel(p) {
  if (p.type === 'free' || !p.sale_price) return 'GRATIS'
  return formatRupiah(p.sale_price)
}

export default function ProductBuilder({ products: initialProducts, categories = [], siteName = 'BGY' }) {
  const [products, setProducts] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('_bgym_demo_products') || '[]')
        if (saved.length) {
          return [...saved].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        }
      } catch {}
    }
    return [...initialProducts].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  })
  const [tab, setTab] = useState('all') // all | free | paid
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id || null)
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showBlockPicker, setShowBlockPicker] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('_bgym_demo_products', JSON.stringify(products))
    }
  }, [products])

  const filtered = useMemo(() => {
    let list = [...products]
    if (tab === 'free') list = list.filter((p) => p.type === 'free')
    if (tab === 'paid') list = list.filter((p) => p.type === 'paid')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.title?.toLowerCase().includes(q))
    }
    return list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }, [products, tab, search])

  const selected = products.find((p) => p.id === selectedId) || null
  const previewList = products.filter((p) => p.is_active).slice(0, 8)

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 2500)
  }

  function reorder(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return
    setProducts((prev) => {
      const next = [...prev].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      const fromIdx = next.findIndex((p) => p.id === fromId)
      const toIdx = next.findIndex((p) => p.id === toId)
      if (fromIdx < 0 || toIdx < 0) return prev
      const [item] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, item)
      return next.map((p, i) => ({ ...p, sort_order: i + 1 }))
    })
  }

  function toggleActive(id) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
    )
  }

  function toggleHighlight(id) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_featured: !p.is_featured } : p))
    )
  }

  function duplicateProduct(product) {
    const id = `${product.id}-copy-${Date.now()}`
    setProducts((prev) => [
      ...prev,
      {
        ...product,
        id,
        title: `${product.title} (Copy)`,
        slug: `${product.slug || 'produk'}-copy-${Date.now()}`,
        sort_order: prev.length + 1,
        is_active: false,
      },
    ])
    setSelectedId(id)
    showToast('success', 'Produk diduplikasi sebagai draft.')
  }

  function deleteProduct(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setSelectedId((current) => (current === id ? products.find((p) => p.id !== id)?.id || null : current))
    showToast('success', 'Produk dihapus dari daftar lokal.')
  }

  async function handleSaveOrder() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: products.map((p, i) => ({
            id: p.id,
            sort_order: i + 1,
            is_active: !!p.is_active,
            is_featured: !!p.is_featured,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast('error', data.error || 'Gagal menyimpan')
      } else {
        showToast('success', data.demo ? 'Mode demo — urutan tidak ke DB' : 'Urutan produk tersimpan!')
      }
    } catch (e) {
      showToast('error', e.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header ala Lynk */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">My Produk</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Drag & drop urutan · Preview HP realtime
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/produk"
            target="_blank"
            className="text-sm font-semibold text-gray-600 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
          >
            Share
          </a>
          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={saving}
            className="text-sm font-bold text-white bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Urutan'}
          </button>
        </div>
      </div>

      {/* URL bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400 font-semibold shrink-0">Toko:</span>
        <code className="flex-1 min-w-0 text-sm text-[#0ea5a0] font-medium truncate bg-teal-50/50 px-3 py-1.5 rounded-lg">
          /produk · /free
        </code>
        <Link
          href="/admin/produk/baru"
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90"
        >
          + Produk
        </Link>
      </div>

      <AdminToast toast={toast?.type} message={toast?.msg} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        {/* LEFT */}
        <div className="space-y-4 min-w-0">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'free', label: 'Gratis' },
              { id: 'paid', label: 'Berbayar' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  tab === t.id
                    ? 'bg-[#0ea5a0] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
            <div className="flex-1" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="w-full sm:w-48 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]"
            />
          </div>

          {/* Add block bar */}
          <button
            type="button"
            onClick={() => setShowBlockPicker(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0ea5a0] to-[#14b8a6] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.96]"
          >
            <span className="text-lg leading-none">+</span> Add new block
          </button>

          {showBlockPicker && (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setShowBlockPicker(false)}>
              <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-700">Add new block</h2>
                    <div className="mt-4 flex gap-4 text-sm font-bold text-slate-400">
                      <span className="text-slate-700">All Blocks</span>
                      <span>Basic</span>
                      <span>Monetization</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowBlockPicker(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-slate-400 hover:bg-slate-50" aria-label="Tutup">×</button>
                </div>
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="mb-3 text-sm font-extrabold text-slate-600">Basic</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[['image','Image','Add images','/admin/produk/baru'],['text','Text','Add headlines and descriptions','/admin/produk/baru?block=text'],['link','Link','Add a link shortcut','/admin/produk/baru?block=link'],['package','Digital Product','Sell file, ebook, or template','/admin/produk/baru']].map(([icon, title, description, href]) => (
                    <Link key={title} href={href} onClick={() => setShowBlockPicker(false)} className="group flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition-colors hover:border-[#25bd83] hover:bg-emerald-50/60">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-[#18a873]">{icon === 'image' ? '▧' : icon === 'text' ? 'T' : icon === 'link' ? '↗' : '▣'}</span><span><b className="block text-slate-700">{title}</b><small className="text-slate-400">{description}</small></span>
                    </Link>
                  ))}
                </div>
                </div>
              </div>
            </div>
          )}

          {/* Block list */}
          <div className="overflow-visible rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
              <h2 className="text-sm font-bold text-gray-900">Block List</h2>
              <span className="text-xs text-gray-400">{filtered.length} produk</span>
            </div>

            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                Belum ada produk. Klik <strong>Add new block</strong>.
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {filtered.map((p) => {
                  const active = selectedId === p.id
                  const isOver = overId === p.id && dragId !== p.id
                  const cat = p.category || categories.find((c) => c.id === p.category_id)
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={() => setDragId(p.id)}
                      onDragEnd={() => {
                        setDragId(null)
                        setOverId(null)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setOverId(p.id)
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        reorder(dragId, p.id)
                        setDragId(null)
                        setOverId(null)
                      }}
                      onClick={() => setSelectedId(p.id)}
                      className={`relative flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 shadow-sm transition-all ${
                        active ? 'border-[#0ea5a0]/30 bg-[rgba(14,165,160,0.07)]' : 'border-gray-100 bg-white hover:bg-gray-50/80'
                      } ${isOver ? 'ring-2 ring-inset ring-[#0ea5a0]/40' : ''} ${
                        dragId === p.id ? 'opacity-40' : ''
                      } ${p.is_featured ? 'bgy-highlight-block ring-2 ring-amber-300/80 shadow-[0_0_22px_rgba(251,191,36,0.22)]' : ''}
                      `}
                    >
                      <span className="text-gray-300 cursor-grab active:cursor-grabbing select-none text-lg px-0.5">
                        ⠿
                      </span>

                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5">
                        {p.cover_path ? (
                          <img src={p.cover_path} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div
                            className={`flex h-full w-full items-center justify-center text-xs font-bold text-white ${
                              p.type === 'free'
                                ? 'bg-gradient-to-br from-sky-400 to-sky-600'
                                : 'bg-gradient-to-br from-amber-400 to-orange-500'
                            }`}
                          >
                            {p.type === 'free' ? '↓' : 'Rp'}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              p.type === 'free'
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {priceLabel(p)}
                          </span>
                          {cat && (
                            <span className="text-[10px] text-gray-400 truncate">{cat.name}</span>
                          )}
                          {p.is_featured && (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Highlight</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleActive(p.id)
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {p.is_active ? 'ON' : 'OFF'}
                      </button>

                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId((current) => (current === p.id ? null : p.id))
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25bd83] text-xl font-bold leading-none text-white shadow-sm transition-transform duration-150 active:scale-[0.96]"
                          aria-label={`Buka menu ${p.title}`}
                          aria-expanded={openMenuId === p.id}
                        >
                          ⋯
                        </button>
                        {openMenuId === p.id && (
                          <div className="absolute right-0 top-11 z-20 w-64 overflow-hidden rounded-2xl bg-white text-sm text-gray-700 shadow-2xl ring-1 ring-black/5">
                            <button type="button" onClick={(e) => { e.stopPropagation(); toggleActive(p.id); setOpenMenuId(null) }} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50">
                              <span>Show / Hide</span>
                              <span className={`h-6 w-11 rounded-full p-0.5 ${p.is_active ? 'bg-[#25bd83]' : 'bg-gray-200'}`}>
                                <span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${p.is_active ? 'translate-x-5' : ''}`} />
                              </span>
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); toggleHighlight(p.id); setOpenMenuId(null) }} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50">
                              <span>Highlight</span>
                              <span className={`h-6 w-11 rounded-full p-0.5 ${p.is_featured ? 'bg-[#25bd83]' : 'bg-gray-200'}`}>
                                <span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${p.is_featured ? 'translate-x-5' : ''}`} />
                              </span>
                            </button>
                            <div className="border-t border-gray-100" />
                            <button type="button" onClick={(e) => { e.stopPropagation(); duplicateProduct(p); setOpenMenuId(null) }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50">
                              <span className="text-lg">⧉</span> Duplicate
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); showToast('success', 'Drag produk dari handle kiri untuk memindahkan urutan.'); setOpenMenuId(null) }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50">
                              <span className="text-lg">↔</span> Move Block
                            </button>
                            <Link href={`/admin/produk/${p.id}/edit`} onClick={(e) => e.stopPropagation()} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50">
                              <span className="text-lg">✎</span> Edit Product
                            </Link>
                            <button type="button" onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); setOpenMenuId(null) }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50">
                              <span className="text-lg">⌫</span> Delete Product
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Selected detail mini */}
          {selected && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-semibold">Dipilih</p>
                <p className="text-sm font-bold text-gray-900 truncate">{selected.title}</p>
              </div>
              <Link
                href={`/admin/produk/${selected.id}/edit`}
                className="text-sm font-bold text-white bg-[#0ea5a0] px-4 py-2 rounded-xl hover:bg-[#0d7a8a]"
              >
                Edit Produk
              </Link>
              <a
                href={`/produk/${selected.slug}`}
                target="_blank"
                className="text-sm font-semibold text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50"
              >
                Lihat
              </a>
            </div>
          )}
        </div>

        {/* RIGHT: phone preview */}
        <div className="xl:sticky xl:top-16">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Page Preview
          </p>
          <div className="mx-auto w-[290px]">
            <div className="relative rounded-[2.2rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-2xl z-20" />
              <div className="h-[540px] bg-gradient-to-b from-[#0d7a8a] via-[#0ea5a0] to-[#e8f7f6] overflow-y-auto">
                {/* header store */}
                <div className="pt-8 pb-4 px-4 text-center text-white">
                  <div className="w-14 h-14 mx-auto rounded-full bg-white/20 backdrop-blur border-2 border-white/40 flex items-center justify-center text-sm font-extrabold mb-2">
                    {siteName.slice(0, 3).toUpperCase()}
                  </div>
                  <p className="text-sm font-extrabold">@{siteName.toLowerCase()}</p>
                  <p className="text-[10px] text-white/80 mt-0.5">Toko digital guru</p>
                  <div className="flex justify-center gap-2 mt-2 text-[10px] text-white/70">
                    <span>WA</span>
                    <span>·</span>
                    <span>TT</span>
                    <span>·</span>
                    <span>IG</span>
                  </div>
                </div>

                <div className="px-3 pb-6 space-y-2">
                  {previewList.length === 0 && (
                    <div className="bg-white/90 rounded-2xl p-4 text-center text-xs text-gray-400">
                      Tidak ada produk aktif
                    </div>
                  )}
                  {previewList.map((p) => {
                    const hi = selectedId === p.id
                    const layout = p.card_layout || 'compact'
                    if (layout === 'portrait' || layout === 'square') {
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedId(p.id)}
                          className={`w-[48%] inline-block align-top mr-[4%] odd:mr-0 text-left bg-white rounded-2xl overflow-hidden shadow-sm border transition-all ${
                            hi ? 'border-[#0ea5a0] ring-2 ring-[#0ea5a0]/25' : 'border-transparent'
                          }`}
                        >
                          <div
                            className={`${layout === 'square' ? 'aspect-square' : 'aspect-[3/4]'} flex items-center justify-center text-white text-[10px] font-bold ${
                              p.type === 'free'
                                ? 'bg-gradient-to-br from-sky-400 to-sky-600'
                                : 'bg-gradient-to-br from-amber-400 to-orange-500'
                            }`}
                          >
                            {p.type === 'free' ? 'FREE' : 'PAID'}
                          </div>
                          <div className="p-2">
                            <p className="text-[10px] font-bold text-gray-900 line-clamp-2">{p.title}</p>
                            <p className="text-[9px] font-extrabold text-[#0ea5a0] mt-0.5">{priceLabel(p)}</p>
                          </div>
                        </button>
                      )
                    }
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        className={`w-full text-left bg-white rounded-2xl p-3 shadow-sm border transition-all ${
                          hi ? 'border-[#0ea5a0] ring-2 ring-[#0ea5a0]/25' : 'border-transparent'
                        }`}
                      >
                        <div className="flex gap-2.5">
                          <div
                            className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${
                              p.type === 'free'
                                ? 'bg-gradient-to-br from-sky-400 to-sky-600'
                                : 'bg-gradient-to-br from-amber-400 to-orange-500'
                            }`}
                          >
                            {p.type === 'free' ? 'FREE' : 'PAID'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-gray-900 leading-snug line-clamp-2">
                              {p.title}
                            </p>
                            <p className="text-[10px] font-extrabold text-[#0ea5a0] mt-1">
                              {priceLabel(p)}
                              {p.original_price && p.type === 'paid' && (
                                <span className="text-gray-300 line-through font-medium ml-1">
                                  {formatRupiah(p.original_price)}
                                </span>
                              )}
                            </p>
                            <p className="text-[9px] text-gray-400 mt-0.5 capitalize">{layout}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-3 px-2">
              Drag list kiri untuk urutkan · Klik blok untuk pilih
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
