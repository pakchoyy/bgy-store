import LynkShell from '@/components/public/LynkShell'
import ProductBadge from '@/components/public/ProductBadge'
import CategoryBadge from '@/components/public/CategoryBadge'
import PriceBlock from '@/components/public/PriceBlock'
import StockIndicator from '@/components/public/StockIndicator'
import ProductFAQ from '@/components/public/ProductFAQ'
import ShareButtons from '@/components/public/ShareButtons'
import FilePreview from '@/components/public/FilePreview'
import StickyBuyBar from '@/components/public/StickyBuyBar'
import { demoProducts } from '@/lib/demo-data'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'
import Link from 'next/link'

async function getProduct(slug) {
  if (!hasSupabase()) {
    const product = demoProducts.find((p) => p.slug === slug && p.is_active)
    return { ...demoShellData(), product: product || null, faqs: [] }
  }

  const shell = await fetchStoreShell()

  let product = null
  let faqs = []

  try {
    const { createClient } = await import('@/lib/supabase-server')
    const supabase = await createClient()

    let query = supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)

    try {
      query = query.is('deleted_at', null)
    } catch {}

    const { data } = await query.single()
    product = data || null

    if (product?.id) {
      try {
        const { data: faqData } = await supabase
          .from('product_faqs')
          .select('*')
          .eq('product_id', product.id)
          .order('sort_order')
        faqs = faqData || []
      } catch {}
    }
  } catch (e) {
    console.error('produk/[slug] supabase error:', e)
  }

  if (!product) {
    product = demoProducts.find((p) => p.slug === slug && p.is_active) || null
  }

  return { ...shell, product, faqs }
}

function calcDiscount(original, sale) {
  if (!original || original <= sale) return null
  return Math.round(((original - sale) / original) * 100)
}

export default async function ProdukDetailPage({ params }) {
  const { slug } = params
  const data = await getProduct(slug)
  const { product, navItems, appearance, footerConfig, announcement, faqs } = data

  if (!product) {
    return (
      <LynkShell appearance={appearance} navItems={navItems} footerConfig={footerConfig} announcement={announcement}>
        <div className="bg-white/95 rounded-2xl p-8 text-center shadow-sm">
          <h1 className="text-lg font-extrabold text-gray-900 mb-2">Produk Tidak Ditemukan</h1>
          <p className="text-sm text-gray-500 mb-4">Produk tidak tersedia atau telah dihapus.</p>
          <Link href="/produk" className="inline-flex text-sm font-bold text-[#0ea5a0]">
            Lihat Produk Lain
          </Link>
        </div>
      </LynkShell>
    )
  }

  const isSoldOut = product.stock_type === 'limited' && product.stock_qty <= 0
  const discountPercent = calcDiscount(product.original_price, product.sale_price)
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bantuguruyuk.web.id'}/produk/${product.slug}`

  return (
    <>
      <LynkShell appearance={appearance} navItems={navItems} footerConfig={footerConfig} announcement={announcement}>
        <div className="bg-white/95 rounded-2xl shadow-sm overflow-hidden mb-20">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
            {product.cover_path ? (
              <img src={product.cover_path} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">
                {product.type === 'free' ? 'GRATIS' : 'PAID'}
              </div>
            )}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <ProductBadge badge={product.badge} badgeCustom={product.badge_custom} />
              {isSoldOut && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Sold Out
                </span>
              )}
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && <CategoryBadge category={product.category} />}
              <StockIndicator stockType={product.stock_type} stockQty={product.stock_qty} />
            </div>

            <h1 className="text-lg font-extrabold text-gray-900 leading-snug">{product.title}</h1>
            <PriceBlock salePrice={product.sale_price} originalPrice={product.original_price} />

            {discountPercent && (
              <span className="inline-flex text-xs font-bold bg-red-50 text-red-500 px-2.5 py-1 rounded-full">
                Hemat {discountPercent}%
              </span>
            )}

            {product.description && (
              <div
                className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            <FilePreview
              filePath={product.file_url}
              previewPath={product.preview_path}
              mimeType={product.mime_type}
              fileSize={product.file_size}
              fileName={product.file_name}
            />

            <ProductFAQ faqs={faqs} />
            <ShareButtons productUrl={productUrl} title={product.title} />

            <button
              id="main-buy-button"
              disabled={isSoldOut}
              className={`w-full px-6 py-3 rounded-xl text-sm font-bold text-white transition-all ${
                isSoldOut
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {isSoldOut ? 'Sold Out' : 'Beli Sekarang'}
            </button>
          </div>
        </div>
      </LynkShell>
      <StickyBuyBar product={product} onBuy={() => {}} />
    </>
  )
}
