'use client'

import { SITE_HOST } from '@/lib/site'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useConfirm } from '@/components/ui/confirm'
import AddBlockModal from '@/components/admin/AddBlockModal'
import ProductStack from '@/components/public/ProductStack'
import { CloseButton } from '@/components/ui/close-button'

function priceLabel(p) {
  if (p.type === 'free' || !p.sale_price) return 'GRATIS'
  return formatRupiah(p.sale_price)
}

const BLOCK_ICON = {
  image: <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-8 8" strokeLinejoin="round" /></svg>,
  text: <span className="font-serif text-2xl font-bold leading-none">T</span>,
  link: <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>,
}
const ICON_PATHS = {
  up: 'm6 15 6-6 6 6',
  down: 'm6 9 6 6 6-6',
  more: 'M12 5.5h.01M12 12h.01M12 18.5h.01',
  edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z M13.5 6.5l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  chat: 'M4 19.5 5.4 16A8 8 0 1 1 8 18.6L4 19.5Z',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  bag: 'M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2',
  search: 'm20 20-4.5-4.5M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z',
}
function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}
const PRESS = 'transition-[background-color,color,transform] duration-150 active:scale-[0.94]'

const DEMO_KEY = '_bgym_demo_products'
const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'
const bySortOrder = (a, b) => (a.sort_order || 0) - (b.sort_order || 0)

export default function ProductBuilder({ products: initialProducts, categories = [], contentBlocks: initialContentBlocks = [], appearance = {}, semesterControl = null }) {
  const { addToast } = useToast()
  const { confirm, promptText } = useConfirm()
  const [products, setProducts] = useState(() => [...initialProducts].sort(bySortOrder))
  const [blocks, setBlocks] = useState(() => [...initialContentBlocks].sort(bySortOrder))
  const demoLoaded = useRef(!IS_DEMO)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id || null)
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [blockModalType, setBlockModalType] = useState(null)
  const [editingBlock, setEditingBlock] = useState(null)
  const [orderDirty, setOrderDirty] = useState(false)

  useEffect(() => {
    if (IS_DEMO || orderDirty) return
    setProducts([...initialProducts].sort(bySortOrder))
    setBlocks([...initialContentBlocks].sort(bySortOrder))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProducts, initialContentBlocks])

  useEffect(() => {
    if (!IS_DEMO) return
    try {
      const saved = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]')
      if (Array.isArray(saved) && saved.length) setProducts([...saved].sort(bySortOrder))
    } catch {}
    demoLoaded.current = true
  }, [])

  useEffect(() => {
    if (!IS_DEMO || !demoLoaded.current) return
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(products))
    } catch {}
  }, [products])

  useEffect(() => {
    if (!orderDirty) return
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [orderDirty])

  useEffect(() => {
    if (!openMenuId) return
    const onKey = (e) => { if (e.key === 'Escape') setOpenMenuId(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openMenuId])

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

  const filteredBlocks = useMemo(() => {
    if (tab !== 'all') return []
    let list = [...blocks]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((b) => (b.title || '').toLowerCase().includes(q))
    }
    return list
  }, [blocks, tab, search])

  const mergedList = useMemo(() => {
    const items = [
      ...filtered.map((p) => ({ ...p, _kind: 'product' })),
      ...filteredBlocks.map((b) => ({ ...b, _kind: 'block' })),
    ]
    return items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }, [filtered, filteredBlocks])

  const selected = products.find((p) => p.id === selectedId) || null
  const menuProduct = openMenuId ? products.find((p) => p.id === openMenuId) || null : null

  async function shareProductFile(product, target) {
    const waWindow = target === 'wa' ? window.open('', '_blank') : null
    try {
      const response = await fetch(`/api/admin/products/file?id=${encodeURIComponent(product.id)}`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.url) throw new Error(data.error || 'Gagal mengambil link file.')
      const message = `Halo, terima kasih sudah membeli *${product.title}* di Kreacy 🙏\n\nBerikut ${data.kind === 'link' ? 'link produknya' : 'link download filenya (berlaku 7 hari)'}:\n${data.url}`
      if (target === 'wa') {
        waWindow.location.href = `https://wa.me/?text=${encodeURIComponent(message)}`
      } else {
        await navigator.clipboard.writeText(data.url)
        addToast('Link file disalin', 'success')
      }
    } catch (error) {
      waWindow?.close()
      addToast(error.message || 'Gagal mengambil link file.', 'error')
    }
  }
  const previewProducts = useMemo(() => products.filter((p) => p.is_active).sort(bySortOrder), [products])
  const previewBlocks = useMemo(() => blocks.filter((b) => b.is_active !== false), [blocks])
  const profileName = appearance.profileName || 'Kreacy'
  const previewBg = appearance.bgStyle === 'flat'
    ? { backgroundColor: appearance.bgColor || '#0ea5a0' }
    : { backgroundImage: `linear-gradient(180deg, ${appearance.bgColor || '#0ea5a0'} 0%, ${appearance.bgColor || '#0ea5a0'}cc 35%, #f0fdfa 70%, #f8fafc 100%)` }

  function showToast(type, msg) {
    addToast(msg, type === 'error' ? 'error' : 'success')
  }

  function reorder(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return
    setOrderDirty(true)
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

  function moveItem(id, kind, direction) {
    const combined = [
      ...products.map((p) => ({ id: p.id, kind: 'product', sort_order: p.sort_order || 0 })),
      ...blocks.map((b) => ({ id: b.id, kind: 'block', sort_order: b.sort_order || 0 })),
    ].sort((a, b) => a.sort_order - b.sort_order)

    const idx = combined.findIndex((x) => x.id === id && x.kind === kind)
    if (idx < 0) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= combined.length) return

    setOrderDirty(true)
    const next = [...combined]
    const [moved] = next.splice(idx, 1)
    next.splice(targetIdx, 0, moved)

    const productOrder = new Map()
    const blockOrder = new Map()
    next.forEach((entry, i) => {
      const sortOrder = i + 1
      if (entry.kind === 'product') productOrder.set(entry.id, sortOrder)
      else blockOrder.set(entry.id, sortOrder)
    })

    setProducts((prev) => prev.map((p) => (productOrder.has(p.id) ? { ...p, sort_order: productOrder.get(p.id) } : p)))
    setBlocks((prev) => prev.map((b) => (blockOrder.has(b.id) ? { ...b, sort_order: blockOrder.get(b.id) } : b)))
  }

  async function deleteBlock(id) {
    const prevBlocks = blocks
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    try {
      const res = await fetch(`/api/admin/blocks?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus block')
      showToast('success', data.demo ? 'Block dihapus (mode demo).' : 'Block dihapus.')
    } catch (e) {
      setBlocks(prevBlocks)
      showToast('error', e.message || 'Gagal menghapus block')
    }
  }

  function handleBlockCreated(block) {
    if (!block) return
    setBlocks((prev) => [...prev, block])
  }

  function handleBlockUpdated(block) {
    if (!block?.id) return
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, ...block } : b)))
    setEditingBlock(null)
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

  async function createVariants(product) {
    const input = await promptText({
      title: `Buat varian dari "${product.title}"`,
      message: 'Tulis nama varian, pisahkan dengan koma. Contoh: Kelas 1, Kelas 2, Kelas 3',
      placeholder: 'Kelas 1, Kelas 2, Kelas 3',
      confirmLabel: 'Buat varian',
    })
    if (input == null) return
    const names = String(input || '').split(',').map((n) => n.trim()).filter(Boolean).slice(0, 12)
    if (!names.length) return
    let created = 0
    for (const name of names) {
      try {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...product,
            title: `${product.title} – ${name}`,
            is_active: false,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Gagal')
        created += 1
        setProducts((prev) => [...prev, { ...data.product, sort_order: prev.length + 1 }])
      } catch {}
    }
    showToast(created ? 'success' : 'error', created
      ? `${created} varian dibuat sebagai draft. Edit judul, file, dan harganya lalu aktifkan.`
      : 'Varian gagal dibuat. Mungkin slug sudah dipakai.')
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
      const requests = [
        fetch('/api/admin/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: products.map((p) => ({
              id: p.id,
              sort_order: p.sort_order || 1,
              is_active: !!p.is_active,
              is_featured: !!p.is_featured,
            })),
          }),
        }),
      ]
      if (blocks.length) {
        requests.push(
          fetch('/api/admin/blocks', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blocks: blocks.map((b) => ({
                id: b.id,
                sort_order: b.sort_order || 1,
                is_active: b.is_active !== false,
              })),
            }),
          })
        )
      }
      const results = await Promise.all(requests)
      const payloads = await Promise.all(results.map((r) => r.json().catch(() => ({}))))
      const failed = results.find((r) => !r.ok)
      if (failed) {
        showToast('error', payloads.find((p) => p.error)?.error || 'Gagal menyimpan')
      } else {
        setOrderDirty(false)
        showToast('success', payloads[0]?.demo ? 'Mode demo — urutan tidak ke DB' : 'Urutan tersimpan!')
      }
    } catch (e) {
      showToast('error', e.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Bagian atas ringkas */}
      <div className="space-y-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-2">
          <a
            href="/produk"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 ${PRESS}`}
            aria-label="Buka toko di tab baru"
          >
            <span className="min-w-0 flex-1 truncate font-medium">{SITE_HOST}/produk</span>
            <Icon name="external" className="h-4 w-4 shrink-0 text-slate-500" />
          </a>
          <Button onClick={() => setShowBlockPicker(true)} className="shrink-0 gap-1.5 px-4">
            <Icon name="plus" className="h-5 w-5" /> Tambah
          </Button>
        </div>
        {semesterControl}
        <div className="flex items-center gap-2">
          <div className="flex shrink-0 gap-0.5 rounded-xl bg-slate-100 p-0.5">
            {[['all', 'Semua'], ['free', 'Gratis'], ['paid', 'Berbayar']].map(([key, label]) => (
              <button key={key} type="button" onClick={() => setTab(key)} aria-pressed={tab === key} className={`min-h-11 rounded-lg px-2.5 text-[13px] font-semibold ${PRESS} ${tab === key ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
            ))}
          </div>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Cari produk</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari..." className="pl-9" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        {/* LEFT */}
        <div className="space-y-4 min-w-0">
          {orderDirty && (
            <div className="sticky top-14 z-20 flex items-center gap-3 rounded-2xl bg-amber-50 p-2 pl-4 ring-1 ring-amber-200">
              <p className="flex-1 text-sm font-medium text-amber-900">Urutan berubah, belum disimpan</p>
              <Button onClick={handleSaveOrder} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Urutan'}</Button>
            </div>
          )}

          {/* Block picker dialog */}
          {showBlockPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setShowBlockPicker(false)}>
              <Card className="my-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-3">
                  <h2 className="text-base font-bold text-slate-900">Tambah ke toko</h2>
                  <CloseButton onClick={() => setShowBlockPicker(false)} />
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  <Link href="/admin/produk/baru" onClick={() => setShowBlockPicker(false)} className={`flex min-h-16 items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 hover:bg-emerald-50 ${PRESS}`}>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white"><Icon name="bag" /></span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900">Produk</span>
                      <span className="block text-xs text-slate-600">Barang yang dijual atau dibagikan gratis (file, link)</span>
                    </span>
                  </Link>
                  <p className="px-1 pt-2 text-xs font-semibold text-slate-500">Hiasan / info di halaman toko (bukan barang)</p>
                  {[['image', 'Gambar', 'Banner atau foto pengumuman'], ['text', 'Teks', 'Judul pemisah atau keterangan'], ['link', 'Link', 'Tombol menuju WA, IG, atau situs lain']].map(([type, title, description]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setShowBlockPicker(false)
                        setBlockModalType(type)
                      }}
                      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50 ${PRESS}`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">{BLOCK_ICON[type]}</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">{title}</span>
                        <span className="block text-xs text-slate-500">{description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Block list */}
          <div>
            <div className="flex items-center justify-between px-1 pb-2">
              <h2 className="text-base font-bold text-slate-800">Isi Toko</h2>
              <span className="text-xs text-slate-500">{mergedList.length} item · panah untuk urutkan</span>
            </div>
            <div>{mergedList.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                Belum ada isi. Ketuk <strong>Tambah</strong> di atas.
              </div>
            ) : (
              <div className="space-y-2.5">{mergedList.map((item, idx) => {
                  if (item._kind === 'block') {
                    return (
                      <div key={`block-${item.id}`}>
                        <div className="relative flex items-center gap-3 rounded-2xl bg-white py-1 pl-1 pr-1 ring-1 ring-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
                          <div className="-my-1 flex shrink-0 flex-col items-center">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveItem(item.id, 'block', 'up')}
                              aria-label="Pindah block ke atas"
                              className={`flex h-11 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-25 disabled:hover:bg-transparent ${PRESS}`}
                            >
                              <Icon name="up" className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === mergedList.length - 1}
                              onClick={() => moveItem(item.id, 'block', 'down')}
                              aria-label="Pindah block ke bawah"
                              className={`flex h-11 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-25 disabled:hover:bg-transparent ${PRESS}`}
                            >
                              <Icon name="down" className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 text-lg font-black text-slate-500 ring-1 ring-slate-200/70">
                            {item.block_type === 'image' && item.image_path ? (
                              <img src={item.image_path} alt="" className="h-full w-full object-cover" />
                            ) : (
                              BLOCK_ICON[item.block_type]
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="truncate text-[15px] font-medium leading-snug text-slate-700">
                              {item.title || (item.block_type === 'link' ? item.url : item.block_type === 'text' ? (item.text_content || '').replace(/<[^>]*>/g, '').trim().slice(0, 60) || 'Text' : 'Image')}
                            </p>
                            <span className="text-xs text-slate-500">{{ image: 'Gambar', text: 'Teks', link: 'Link' }[item.block_type] || 'Hiasan'} · hiasan toko</span>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button type="button" onClick={() => setEditingBlock(item)} aria-label="Edit blok" className={`flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 ${PRESS}`}><Icon name="edit" /></button>
                            <button
                              type="button"
                              aria-label="Hapus blok"
                              className={`flex h-11 w-11 items-center justify-center rounded-xl text-red-600 hover:bg-red-50 ${PRESS}`}
                              onClick={async () => { const ok = await confirm({ title: 'Hapus block ini?', message: 'Block akan dihapus dari halaman.', confirmLabel: 'Ya, hapus', danger: true }); if (ok) deleteBlock(item.id) }}
                            >
                              <Icon name="trash" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  const p = item
                  const active = selectedId === p.id
                  const isOver = overId === p.id && dragId !== p.id
                  const cat = p.category || categories.find((c) => c.id === p.category_id)
                  return (
                    <div key={`product-${p.id}`}>
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
                        className={`relative flex cursor-pointer items-center gap-3 rounded-2xl bg-white py-1 pl-1 pr-1 ring-1 ring-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-all ${
                          active ? 'ring-2 ring-emerald-400/60' : 'hover:bg-slate-50'
                        } ${isOver ? 'ring-2 ring-inset ring-emerald-500/40' : ''} ${
                          dragId === p.id ? 'opacity-40' : ''
                        } ${p.is_featured ? 'bgy-highlight-block ring-2 ring-amber-300/80 shadow-[0_0_22px_rgba(251,191,36,0.22)]' : ''}
                        `}
                      >
                      <div className="-my-1 flex shrink-0 flex-col items-center">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            moveItem(p.id, 'product', 'up')
                          }}
                          aria-label={`Pindah ${p.title} ke atas`}
                          className={`flex h-11 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-25 disabled:hover:bg-transparent ${PRESS}`}
                        >
                          <Icon name="up" className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === mergedList.length - 1}
                          onClick={(e) => {
                            e.stopPropagation()
                            moveItem(p.id, 'product', 'down')
                          }}
                          aria-label={`Pindah ${p.title} ke bawah`}
                          className={`flex h-11 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-25 disabled:hover:bg-transparent ${PRESS}`}
                        >
                          <Icon name="down" className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200/70">
                        {p.cover_path ? (
                          <img src={p.cover_path} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className={`flex h-full w-full items-center justify-center ${p.type === 'free' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                            {p.type === 'free' ? (
                              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" /></svg>
                            ) : (
                              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" opacity=".9" /><rect x="6" y="12" width="7" height="1.8" rx=".9" fill="#fff" /><rect x="6" y="15" width="4" height="1.8" rx=".9" fill="#fff" /></svg>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-2 break-words text-[15px] font-semibold leading-snug text-slate-800">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-xs font-bold ${p.type === 'free' ? 'text-emerald-700' : 'text-slate-700'}`}>{priceLabel(p)}</span>
                          {cat && (
                            <span className="text-[10px] text-slate-500">{cat.name}</span>
                          )}
                          {p.semester && (
                            <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">Smt {p.semester}</span>
                          )}
                          {p.is_featured && (
                            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">Highlight</Badge>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!p.is_active}
                        aria-label={`${p.is_active ? 'Sembunyikan' : 'Tampilkan'} ${p.title} di toko`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleActive(p.id)
                        }}
                        className="flex min-h-11 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-xl hover:bg-slate-50"
                      >
                        <span className={`relative h-6 w-11 rounded-full transition-colors duration-150 ${p.is_active ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                          <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 ${p.is_active ? 'translate-x-5' : ''}`} />
                        </span>
                        <span className={`text-[10px] font-semibold leading-none ${p.is_active ? 'text-emerald-800' : 'text-slate-500'}`}>{p.is_active ? 'Tampil' : 'Disembunyikan'}</span>
                      </button>

                      <div className="relative shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-11 w-9 text-slate-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId((current) => (current === p.id ? null : p.id))
                          }}
                          aria-label={`Buka menu ${p.title}`}
                          aria-haspopup="dialog"
                          aria-expanded={openMenuId === p.id}
                        >
                          <Icon name="more" />
                        </Button>
                      </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            </div>
          </div>

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

        {/* RIGHT: preview langsung (di HP muncul di bawah daftar) */}
        <div className="xl:sticky xl:top-16">
          <p className="mb-2 px-1 text-base font-bold text-slate-800 xl:text-xs xl:font-semibold xl:text-slate-500">
            Preview langsung
          </p>
          <div className="mx-auto w-[290px]">
            <div className="relative rounded-[2.2rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-2xl z-20" />
              <div
                className="h-[540px] overflow-y-auto"
                style={previewBg}
                onClickCapture={(e) => {
                  const link = e.target.closest('a')
                  if (link) e.preventDefault()
                }}
              >
                <div className="px-3 pt-8 pb-3 text-center text-white">
                  <div className="mx-auto mb-2 h-14 w-14 overflow-hidden rounded-full border-2 border-white/50 bg-white/20">
                    {appearance.profileAvatarUrl ? (
                      <img src={appearance.profileAvatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm font-bold">{profileName.slice(0, 3).toUpperCase()}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold">{profileName}</p>
                  {appearance.profileHandle && <p className="text-[11px] text-white/85">{appearance.profileHandle}</p>}
                </div>
                <div className="px-3 pb-6">
                  <ProductStack products={previewProducts} contentBlocks={previewBlocks} emptyText="Tidak ada produk aktif" animate={false} />
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-3 px-2">
              Preview langsung berubah saat urutan, ON/OFF, atau highlight diubah
            </p>
          </div>
        </div>
      </div>


      {menuProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" onClick={() => setOpenMenuId(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Menu ${menuProduct.title}`}
            className="w-full max-w-sm overflow-hidden rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="min-w-0 truncate text-sm font-bold text-slate-900">{menuProduct.title}</p>
              <CloseButton label="Tutup menu" onClick={() => setOpenMenuId(null)} />
            </div>
            <div className="py-1">
              <button type="button" className="flex min-h-12 w-full items-center justify-between px-4 text-sm font-medium text-slate-800 hover:bg-slate-50" onClick={() => { toggleActive(menuProduct.id); setOpenMenuId(null) }}>
                <span>Tampilkan di toko</span>
                <span className={`h-5 w-9 rounded-full p-0.5 ${menuProduct.is_active ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                  <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${menuProduct.is_active ? 'translate-x-4' : ''}`} />
                </span>
              </button>
              <button type="button" className="flex min-h-12 w-full items-center justify-between px-4 text-sm font-medium text-slate-800 hover:bg-slate-50" onClick={() => { toggleHighlight(menuProduct.id); setOpenMenuId(null) }}>
                <span>Highlight</span>
                <span className={`h-5 w-9 rounded-full p-0.5 ${menuProduct.is_featured ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                  <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${menuProduct.is_featured ? 'translate-x-4' : ''}`} />
                </span>
              </button>
              <div className="my-1 border-t border-slate-100" />
              <Link href={`/admin/produk/${menuProduct.id}/edit`} className="flex min-h-12 w-full items-center gap-3 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50">
                <Icon name="edit" className="h-5 w-5 shrink-0 text-slate-500" /> Edit produk
              </Link>
              <a href={`/api/admin/products/file?id=${menuProduct.id}&mode=download`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 w-full items-center gap-3 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50">
                <Icon name="download" className="h-5 w-5 shrink-0 text-slate-500" /> Download / buka file produk
              </a>
              <button type="button" className="flex min-h-12 w-full items-center gap-3 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50" onClick={() => { shareProductFile(menuProduct, 'copy'); setOpenMenuId(null) }}>
                <Icon name="link" className="h-5 w-5 shrink-0 text-slate-500" /> Salin link file (berlaku 7 hari)
              </button>
              <button type="button" className="flex min-h-12 w-full items-center gap-3 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50" onClick={() => { shareProductFile(menuProduct, 'wa'); setOpenMenuId(null) }}>
                <Icon name="chat" className="h-5 w-5 shrink-0 text-slate-500" /> Kirim link file via WhatsApp
              </button>
              <button type="button" className="flex min-h-12 w-full items-center gap-3 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50" onClick={() => { duplicateProduct(menuProduct); setOpenMenuId(null) }}>
                <Icon name="copy" className="h-5 w-5 shrink-0 text-slate-500" /> Duplikat
              </button>
              <button type="button" className="flex min-h-12 w-full items-center gap-3 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50" onClick={() => { const target = menuProduct; setOpenMenuId(null); createVariants(target) }}>
                <Icon name="grid" className="h-5 w-5 shrink-0 text-slate-500" /> Buat varian (Kelas 1, 2, 3…)
              </button>
              <button type="button" className="flex min-h-12 w-full items-center gap-3 px-4 text-sm font-semibold text-red-600 hover:bg-red-50" onClick={async () => { const target = menuProduct; setOpenMenuId(null); const ok = await confirm({ title: `Hapus "${target.title}"?`, message: 'Produk dipindahkan ke Recycle Bin.', confirmLabel: 'Ya, hapus', danger: true }); if (ok) deleteProduct(target.id) }}>
                <Icon name="trash" className="h-5 w-5 shrink-0" /> Hapus produk
              </button>
            </div>
          </div>
        </div>
      )}

      {blockModalType && (
        <AddBlockModal
          type={blockModalType}
          onClose={() => setBlockModalType(null)}
          onCreated={handleBlockCreated}
        />
      )}

      {editingBlock && (
        <AddBlockModal
          type={editingBlock.block_type}
          initialBlock={editingBlock}
          onClose={() => setEditingBlock(null)}
          onUpdated={handleBlockUpdated}
        />
      )}
    </div>
  )
}
