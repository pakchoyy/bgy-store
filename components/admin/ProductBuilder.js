'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

function priceLabel(p) {
  if (p.type === 'free' || !p.sale_price) return 'GRATIS'
  return formatRupiah(p.sale_price)
}

export default function ProductBuilder({ products: initialProducts, categories = [], siteName = 'BGY' }) {
  const { addToast } = useToast()
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
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id || null)
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [saving, setSaving] = useState(false)
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
    addToast(msg, type === 'error' ? 'error' : 'success')
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

  function moveProduct(id, direction) {
    setProducts((prev) => {
      const next = [...prev].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      const idx = next.findIndex((p) => p.id === id)
      if (idx < 0) return prev
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= next.length) return prev
      const [item] = next.splice(idx, 1)
      next.splice(targetIdx, 0, item)
      return next.map((p, i) => ({ ...p, sort_order: i + 1 }))
    })
  }

  async function patchProduct(id, patch) {
    const current = products.find((p) => p.id === id)
    if (!current) return
    const prevProducts = products
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: [{
            id,
            sort_order: current.sort_order || 1,
            is_active: patch.is_active ?? current.is_active,
            is_featured: patch.is_featured ?? current.is_featured,
          }],
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan perubahan')
      if (data.demo) showToast('success', 'Mode demo — perubahan tidak ke DB')
    } catch (e) {
      setProducts(prevProducts)
      showToast('error', e.message || 'Gagal menyimpan perubahan')
    }
  }

  function toggleActive(id) {
    const product = products.find((p) => p.id === id)
    if (product) patchProduct(id, { is_active: !product.is_active })
  }

  function toggleHighlight(id) {
    const product = products.find((p) => p.id === id)
    if (product) patchProduct(id, { is_featured: !product.is_featured })
  }

  async function duplicateProduct(product) {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          title: `${product.title} (Copy)`,
          slug: `${product.slug || 'produk'}-copy-${Date.now()}`,
          is_active: false,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Gagal menduplikasi produk')
      const newProduct = data.product
      setProducts((prev) => [...prev, { ...newProduct, sort_order: prev.length + 1 }])
      setSelectedId(newProduct.id)
      showToast('success', data.demo ? 'Produk diduplikasi (mode demo).' : 'Produk diduplikasi sebagai draft.')
    } catch (e) {
      showToast('error', e.message || 'Gagal menduplikasi produk')
    }
  }

  async function deleteProduct(id) {
    const prevProducts = products
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setSelectedId((current) => (current === id ? products.find((p) => p.id !== id)?.id || null : current))
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus produk')
      showToast('success', data.demo ? 'Produk dihapus (mode demo).' : 'Produk dipindahkan ke recycle bin.')
    } catch (e) {
      setProducts(prevProducts)
      showToast('error', e.message || 'Gagal menghapus produk')
    }
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
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Produk</h1>
          <p className="text-sm text-slate-500 mt-1">
            Drag & drop urutan · Preview HP realtime
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/produk" target="_blank">
              Share
            </a>
          </Button>
          <Button onClick={handleSaveOrder} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Urutan'}
          </Button>
        </div>
      </div>

      {/* URL bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          <span className="text-xs text-slate-500 font-semibold shrink-0">Toko:</span>
          <code className="flex-1 min-w-0 text-sm text-teal-600 font-medium truncate bg-teal-50 px-3 py-1.5 rounded-lg">
            /produk · /free
          </code>
          <Button asChild size="sm">
            <Link href="/admin/produk/baru">
              + Produk
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        {/* LEFT */}
        <div className="space-y-4 min-w-0">
          {/* Tabs & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={tab === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setTab('all')}>
              Semua
            </Button>
            <Button variant={tab === 'free' ? 'default' : 'outline'} size="sm" onClick={() => setTab('free')}>
              Gratis
            </Button>
            <Button variant={tab === 'paid' ? 'default' : 'outline'} size="sm" onClick={() => setTab('paid')}>
              Berbayar
            </Button>
            <div className="flex-1" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="w-full sm:w-48"
            />
          </div>

          {/* Add block button */}
          <Button
            onClick={() => setShowBlockPicker(true)}
            className="w-full"
            size="lg"
          >
            + Add new block
          </Button>

          {/* Block picker dialog */}
          {showBlockPicker && (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setShowBlockPicker(false)}>
              <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">Add new block</h2>
                    <div className="mt-2 flex gap-4 text-xs font-semibold text-slate-500">
                      <span className="text-slate-700">All Blocks</span>
                      <span>Basic</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowBlockPicker(false)}>
                    ✕
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-3">Basic</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[['image','Image','Add images','/admin/produk/baru'],['text','Text','Add headlines','/admin/produk/baru?block=text'],['link','Link','Add link shortcut','/admin/produk/baru?block=link'],['package','Digital Product','Sell files','/admin/produk/baru']].map(([icon, title, description, href]) => (
                        <Link key={title} href={href} onClick={() => setShowBlockPicker(false)} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-teal-300 hover:bg-teal-50 transition-colors">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-sm font-bold text-teal-600">{icon === 'image' ? '▧' : icon === 'text' ? 'T' : icon === 'link' ? '↗' : '▣'}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{title}</p>
                            <p className="text-xs text-slate-500">{description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Block list */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <h2 className="text-sm font-bold">Block List</h2>
              <span className="text-xs text-slate-500">{filtered.length} produk</span>
            </CardHeader>
            <CardContent className="p-0">{filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                Belum ada produk. Klik <strong>Add new block</strong>.
              </div>
            ) : (
              <div className="space-y-2 p-3">{filtered.map((p, idx) => {
                  const active = selectedId === p.id
                  const isOver = overId === p.id && dragId !== p.id
                  const cat = p.category || categories.find((c) => c.id === p.category_id)
                  return (
                    <ScrollReveal key={p.id} delay={idx * 50}>
                      <div
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
                      <div className="flex flex-col items-center shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            moveProduct(p.id, 'up')
                          }}
                          aria-label={`Pindah ${p.title} ke atas`}
                          className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          ▲
                        </button>
                        <span className="text-gray-300 cursor-grab active:cursor-grabbing select-none text-lg px-0.5 hidden sm:inline-flex">
                          ⠿
                        </span>
                        <button
                          type="button"
                          disabled={idx === filtered.length - 1}
                          onClick={(e) => {
                            e.stopPropagation()
                            moveProduct(p.id, 'down')
                          }}
                          aria-label={`Pindah ${p.title} ke bawah`}
                          className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          ▼
                        </button>
                      </div>

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
                        <p className="text-sm font-semibold text-slate-900 truncate leading-snug">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge variant={p.type === 'free' ? 'secondary' : 'default'} className="text-[10px]">
                            {priceLabel(p)}
                          </Badge>
                          {cat && (
                            <span className="text-[10px] text-slate-500">{cat.name}</span>
                          )}
                          {p.is_featured && (
                            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">Highlight</Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={p.is_active ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleActive(p.id)
                        }}
                      >
                        {p.is_active ? 'ON' : 'OFF'}
                      </Button>

                      <div className="relative shrink-0">
                        <Button
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId((current) => (current === p.id ? null : p.id))
                          }}
                          aria-label={`Buka menu ${p.title}`}
                          aria-expanded={openMenuId === p.id}
                        >
                          ⋯
                        </Button>
                        {openMenuId === p.id && (
                          <Card className="absolute right-0 top-11 z-20 w-64 shadow-xl">
                            <div className="space-y-0">
                              <Button variant="ghost" className="w-full justify-between rounded-none" onClick={(e) => { e.stopPropagation(); toggleActive(p.id); setOpenMenuId(null) }}>
                                <span>Show / Hide</span>
                                <span className={`h-5 w-9 rounded-full p-0.5 ${p.is_active ? 'bg-teal-600' : 'bg-slate-200'}`}>
                                  <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${p.is_active ? 'translate-x-4' : ''}`} />
                                </span>
                              </Button>
                              <Button variant="ghost" className="w-full justify-between rounded-none" onClick={(e) => { e.stopPropagation(); toggleHighlight(p.id); setOpenMenuId(null) }}>
                                <span>Highlight</span>
                                <span className={`h-5 w-9 rounded-full p-0.5 ${p.is_featured ? 'bg-teal-600' : 'bg-slate-200'}`}>
                                  <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${p.is_featured ? 'translate-x-4' : ''}`} />
                                </span>
                              </Button>
                              <div className="border-t border-slate-100" />
                              <Button variant="ghost" className="w-full justify-start rounded-none gap-2" onClick={(e) => { e.stopPropagation(); duplicateProduct(p); setOpenMenuId(null) }}>
                                <span>⧉</span> Duplicate
                              </Button>
                              <Button variant="ghost" className="w-full justify-start rounded-none gap-2" onClick={(e) => { e.stopPropagation(); showToast('success', 'Drag produk dari handle kiri untuk memindahkan urutan.'); setOpenMenuId(null) }}>
                                <span>↔</span> Move Block
                              </Button>
                              <Button variant="ghost" className="w-full justify-start rounded-none gap-2" asChild>
                                <Link href={`/admin/produk/${p.id}/edit`} onClick={(e) => e.stopPropagation()}>
                                  <span>✎</span> Edit Product
                                </Link>
                              </Button>
                              <Button variant="ghost" className="w-full justify-start rounded-none gap-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); setOpenMenuId(null) }}>
                                <span>⌫</span> Delete Product
                              </Button>
                            </div>
                          </Card>
                        )}
                      </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            )}
            </CardContent>
          </Card>

          {/* Selected detail mini */}
          {selected && (
            <Card>
              <CardContent className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 font-semibold">Dipilih</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{selected.title}</p>
                </div>
                <Button asChild>
                  <Link href={`/admin/produk/${selected.id}/edit`}>
                    Edit Produk
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/produk/${selected.slug}`} target="_blank">
                    Lihat
                  </a>
                </Button>
              </CardContent>
            </Card>
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
