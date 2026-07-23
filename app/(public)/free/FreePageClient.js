'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCardLayout } from '@/lib/utils'
import SearchInput from '@/components/public/SearchInput'
import DownloadModal from '@/components/public/DownloadModal'
import ProductCard from '@/components/public/ProductCard'

export default function FreePageClient({ products, categories, settings }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const cat = searchParams.get('category') || ''

  const [selectedCategory, setSelectedCategory] = useState(cat)
  const [searchQuery, setSearchQuery] = useState(q)
  const [downloadProduct, setDownloadProduct] = useState(null)

  const filtered = useMemo(() => {
    let result = products
    if (selectedCategory) {
      result = result.filter(
        (p) => p.category_id === selectedCategory || p.category?.slug === selectedCategory
      )
    }
    if (searchQuery) {
      const sq = searchQuery.toLowerCase()
      result = result.filter((p) => p.title.toLowerCase().includes(sq))
    }
    return result
  }, [products, selectedCategory, searchQuery])

  const handleSearch = useCallback(
    (value) => {
      setSearchQuery(value)
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set('q', value)
      else params.delete('q')
      router.replace(`/free?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const handleCategoryClick = useCallback(
    (slug) => {
      const next = selectedCategory === slug ? '' : slug
      setSelectedCategory(next)
      const params = new URLSearchParams(searchParams.toString())
      if (next) params.set('category', next)
      else params.delete('category')
      router.replace(`/free?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, selectedCategory]
  )

  const categoriesWithProducts = useMemo(() => {
    const catIds = new Set(products.map((p) => p.category_id))
    return categories.filter((c) => catIds.has(c.id))
  }, [products, categories])

  return (
    <>
      <div className="space-y-3">
        <SearchInput initialValue={q} onSearch={handleSearch} placeholder="Cari produk gratis..." />

        {categoriesWithProducts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categoriesWithProducts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCategoryClick(c.slug)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === c.slug
                    ? 'bg-white text-[#0d7a8a] shadow'
                    : 'bg-white/20 text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white/90 rounded-2xl p-8 text-center text-sm text-gray-500 shadow-sm">
            Tidak ada produk gratis ditemukan
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product) => {
              const layout = getCardLayout(product.card_layout)
              const span =
                layout.value === 'landscape' ||
                layout.value === 'wide' ||
                layout.value === 'compact'
                  ? 'col-span-2'
                  : 'col-span-1'
              return (
                <div key={product.id} className={`${span} space-y-2`}>
                  <ProductCard product={product} />
                  <button
                    type="button"
                    onClick={() => setDownloadProduct(product)}
                    className="w-full bg-white text-[#0d7a8a] font-bold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
                  >
                    Download Gratis
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {downloadProduct && (
        <DownloadModal
          product={downloadProduct}
          isOpen={!!downloadProduct}
          onClose={() => setDownloadProduct(null)}
          settings={settings}
        />
      )}
    </>
  )
}
