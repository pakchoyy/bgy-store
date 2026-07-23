'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'

function priceLabel(p) {
  if (p.type === 'free' || !p.sale_price) return 'GRATIS'
  return formatRupiah(p.sale_price)
}

export default function ProductBuilder({ products: initialProducts, categories = [], siteName = 'BGY' }) {
  const [products, setProducts] = useState(() =>
    [...initialProducts].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  )
  const [tab, setTab] = useState('all') // all | free | paid
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id || null)
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

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

      {toast && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.msg}
        </div>
      )}

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
          <Link
            href="/admin/produk/baru"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0ea5a0] to-[#14b8a6] text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <span className="text-lg leading-none">+</span> Add new product
          </Link>

          {/* Block list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Block List</h2>
              <span className="text-xs text-gray-400">{filtered.length} produk</span>
            </div>

            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                Belum ada produk. Klik <strong>Add new product</strong>.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
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
                      className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-all ${
                        active ? 'bg-[rgba(14,165,160,0.07)]' : 'hover:bg-gray-50/80'
                      } ${isOver ? 'ring-2 ring-inset ring-[#0ea5a0]/40' : ''} ${
                        dragId === p.id ? 'opacity-40' : ''
                      }`}
                    >
                      <span className="text-gray-300 cursor-grab active:cursor-grabbing select-none text-lg px-0.5">
                        ⠿
                      </span>

                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                          p.type === 'free'
                            ? 'bg-gradient-to-br from-sky-400 to-sky-600'
                            : 'bg-gradient-to-br from-amber-400 to-orange-500'
                        }`}
                      >
                        {p.type === 'free' ? '↓' : 'Rp'}
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

                      <Link
                        href={`/admin/produk/${p.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-300 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 shrink-0"
                        title="Edit"
                      >
                        ⋯
                      </Link>
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
