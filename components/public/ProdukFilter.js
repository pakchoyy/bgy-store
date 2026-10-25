'use client'

import { useEffect, useMemo, useState } from 'react'
import ProductStack from '@/components/public/ProductStack'

// Cari & filter kategori di HP pembeli, supaya halaman /produk bisa disimpan (cache) di Vercel.
export default function ProdukFilter({ products, categories }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setQ(params.get('q') || '')
    setCat(params.get('category') || '')
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (cat) params.set('category', cat)
    const query = params.toString()
    window.history.replaceState(null, '', query ? `/produk?${query}` : '/produk')
  }, [q, cat])

  const filtered = useMemo(() => {
    const sq = q.trim().toLowerCase()
    return products.filter((p) =>
      (!cat || p.category_id === cat || p.category?.slug === cat)
      && (!sq || p.title.toLowerCase().includes(sq)))
  }, [products, q, cat])

  const chip = (active) => `min-h-11 px-4 rounded-full text-sm font-bold transition-colors ${active ? 'bg-white text-[#0d7a8a] shadow' : 'bg-white/20 text-white'}`

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Cari produk"
        placeholder="Cari produk..."
        className="h-11 w-full px-4 bg-white/95 border border-white/60 rounded-xl text-[15px] text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
      />
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setCat('')} aria-pressed={!cat} className={chip(!cat)}>Semua</button>
          {categories.map((c) => (
            <button key={c.id} type="button" onClick={() => setCat(c.slug)} aria-pressed={cat === c.slug || cat === c.id} className={chip(cat === c.slug || cat === c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      <ProductStack products={filtered} emptyText="Tidak ada produk ditemukan" />
    </div>
  )
}
