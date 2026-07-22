'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '@/components/public/ProductCard';
import SearchInput from '@/components/public/SearchInput';
import DownloadModal from '@/components/public/DownloadModal';

export default function FreePageClient({ products, categories, settings }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const cat = searchParams.get('category') || '';

  const [selectedCategory, setSelectedCategory] = useState(cat);
  const [searchQuery, setSearchQuery] = useState(q);
  const [downloadProduct, setDownloadProduct] = useState(null);

  const filtered = useMemo(() => {
    let result = products;
    if (selectedCategory) {
      result = result.filter((p) => p.category_id === selectedCategory || p.category?.slug === selectedCategory);
    }
    if (searchQuery) {
      const sq = searchQuery.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(sq));
    }
    return result;
  }, [products, selectedCategory, searchQuery]);

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('q', value);
    else params.delete('q');
    router.replace(`/free?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleCategoryClick = useCallback((slug) => {
    const next = selectedCategory === slug ? '' : slug;
    setSelectedCategory(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('category', next);
    else params.delete('category');
    router.replace(`/free?${params.toString()}`, { scroll: false });
  }, [router, searchParams, selectedCategory]);

  const handleDownloadClick = useCallback((product) => {
    setDownloadProduct(product);
  }, []);

  const categoriesWithProducts = useMemo(() => {
    const catIds = new Set(products.map((p) => p.category_id));
    return categories.filter((c) => catIds.has(c.id));
  }, [products, categories]);

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <SearchInput
          initialValue={q}
          onSearch={handleSearch}
          placeholder="Cari produk gratis..."
        />

        {categoriesWithProducts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categoriesWithProducts.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                  selectedCategory === cat.slug
                    ? 'text-white border-transparent'
                    : 'text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
                style={selectedCategory === cat.slug ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 font-medium">Tidak ada produk gratis ditemukan</p>
          <p className="text-gray-400 text-sm mt-1">Coba ubah kata kunci atau filter kategori</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{filtered.length} produk ditemukan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard product={product} />
                <button
                  onClick={() => handleDownloadClick(product)}
                  className="mt-2 w-full bg-gradient-to-r from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:shadow-md active:scale-[0.98] transition-all duration-200"
                >
                  Download Gratis
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {downloadProduct && (
        <DownloadModal
          product={downloadProduct}
          isOpen={!!downloadProduct}
          onClose={() => setDownloadProduct(null)}
          settings={settings}
        />
      )}
    </>
  );
}
