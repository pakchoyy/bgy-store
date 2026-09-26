import { sanitizeHtml } from '@/lib/sanitize-html'
import LynkShell from '@/components/public/LynkShell'
import ProductBadge from '@/components/public/ProductBadge'
import CategoryBadge from '@/components/public/CategoryBadge'
import PriceBlock from '@/components/public/PriceBlock'
import StockIndicator from '@/components/public/StockIndicator'
import ProductFAQ from '@/components/public/ProductFAQ'
import ShareButtons from '@/components/public/ShareButtons'
import ProductActions from '@/components/public/ProductActions'
import ProductReviewList from '@/components/public/ProductReviewList'
import { demoProducts } from '@/lib/demo-data'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'
import Link from 'next/link'
import { whatsappUrl, parsePreviewImages, formatRupiah } from '@/lib/utils'
import ProductStack from '@/components/public/ProductStack'
import FlashCountdown from '@/components/public/FlashCountdown'

async function getProduct(slug) {
  if (!hasSupabase()) {
    const product = demoProducts.find((p) => p.slug === slug && p.is_active)
    const related = demoProducts.filter((p) => p.is_active && p.id !== product?.id).slice(0, 4)
    return { ...demoShellData(), product: product || null, faqs: [], bundleItems: [], related, promo: {} }
  }

  const shell = await fetchStoreShell()
  const product = (shell.products || []).find((p) => p.slug === slug) || null
  const { createClient } = await import('@/lib/supabase-server')
  const supabase = await createClient()

  let faqs = []
  if (product?.id) {
    const { data: faqData } = await supabase
      .from('product_faqs')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order')
    faqs = faqData || []
  }

  let delivery = { is_link: false, file_name: null }
  let bundleIds = []
  let promo = {}
  if (product?.id) {
    const { createTrustedServerClient } = await import('@/lib/supabase-server')
    const trusted = await createTrustedServerClient()
    let { data: fileInfo, error: fileError } = await trusted.from('products').select('file_url, file_name, bundle_product_ids').eq('id', product.id).maybeSingle()
    if (fileError) ({ data: fileInfo } = await trusted.from('products').select('file_url, file_name').eq('id', product.id).maybeSingle())
    delivery = { is_link: !!fileInfo?.file_url, file_name: fileInfo?.file_url ? null : fileInfo?.file_name || null }
    bundleIds = Array.isArray(fileInfo?.bundle_product_ids) ? fileInfo.bundle_product_ids : []
    const { data: promoRows } = await supabase.from('settings').select('key,value').like('key', 'promo_after_download_%')
    promo = Object.fromEntries((promoRows || []).map((row) => [row.key, row.value]))
  }

  const all = shell.products || []
  const bundleItems = bundleIds.map((id) => all.find((p) => p.id === id)).filter(Boolean)
  const related = product
    ? all
        .filter((p) => p.id !== product.id && !bundleIds.includes(p.id) && p.category_id && p.category_id === product.category_id)
        .concat(all.filter((p) => p.id !== product.id && !bundleIds.includes(p.id) && p.category_id !== product.category_id))
        .slice(0, 4)
    : []

  let rating = { count: 0, average: 0 }
  if (product?.id) {
    const { createTrustedServerClient } = await import('@/lib/supabase-server')
    const trusted = await createTrustedServerClient()
    const { data: ratings } = await trusted.from('product_reviews').select('rating').eq('product_id', product.id).eq('is_approved', true).limit(500)
    if (ratings?.length) rating = { count: ratings.length, average: Math.round((ratings.reduce((sum, r) => sum + Number(r.rating || 0), 0) / ratings.length) * 10) / 10 }
  }

  return { ...shell, product: product ? { ...product, ...delivery } : null, faqs, bundleItems, related, promo, rating }
}

export async function generateMetadata({ params }) {
  const { product } = await getProduct(params.slug)
  if (!product) return { title: 'Produk tidak ditemukan', robots: { index: false } }
  const title = product.meta_title || `${product.title} | Bantu Guru Yuk`
  const description = product.meta_description || (product.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
  return {
    title,
    description,
    alternates: { canonical: `/produk/${product.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `/produk/${product.slug}`,
      images: [{ url: `/og/produk/${product.slug}`, width: 1200, height: 630, alt: product.title }],
    },
  }
}

export default async function ProdukDetailPage({ params }) {
  const { slug } = params
  const data = await getProduct(slug)
  const { product, navItems, appearance, footerConfig, announcement, faqs, bundleItems = [], related = [], promo = {}, rating = { count: 0, average: 0 } } = data
  const previewImages = parsePreviewImages(product?.preview_path)
  const bundleWorth = bundleItems.reduce((sum, p) => sum + Number(p.sale_price || 0), 0)

  if (!product) {
    return (
      <LynkShell appearance={appearance} navItems={navItems} footerConfig={footerConfig} announcement={announcement} pageHasHeading topBarTitle="Produk">
        <div className="bg-white/95 rounded-2xl p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Produk Tidak Ditemukan</h1>
          <p className="text-sm text-gray-500 mb-4">Produk tidak tersedia atau telah dihapus.</p>
          <Link href="/produk" className="inline-flex text-sm font-bold text-[#0ea5a0]">
            Lihat Produk Lain
          </Link>
        </div>
      </LynkShell>
    )
  }

  const isSoldOut = product.stock_type === 'limited' && product.stock_qty <= 0
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bgy-store.vercel.app'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: (product.meta_description || product.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300) || product.title,
    image: [product.cover_path || `${siteUrl}/og/produk/${product.slug}`],
    brand: { '@type': 'Brand', name: 'Bantu Guru Yuk' },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/produk/${product.slug}`,
      priceCurrency: 'IDR',
      price: Number(product.sale_price || 0),
      availability: isSoldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    },
    ...(rating.count > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating.average, reviewCount: rating.count } } : {}),
  }
  const waUrl = whatsappUrl(appearance?.socialLinks)
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bantuguruyuk.web.id'}/produk/${product.slug}`

  return (
    <LynkShell appearance={appearance} navItems={navItems} footerConfig={footerConfig} announcement={announcement} pageHasHeading topBarTitle={product.title}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <article className="bg-white/95 rounded-[1.6rem] shadow-sm overflow-hidden mb-20 ring-1 ring-white/60">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
          {product.cover_path ? (
            <img src={product.cover_path} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className={`flex h-full w-full flex-col items-center justify-center px-8 text-center text-white ${product.type === 'free' ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 'bg-gradient-to-br from-teal-600 to-[#123b35]'}`}>
              <svg aria-hidden="true" className="h-12 w-12 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M14 3v4a1 1 0 001 1h4M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2zM9 13h6M9 17h4" />
              </svg>
              <p className="mt-3 line-clamp-3 text-lg font-bold leading-snug">{product.title}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/75">{product.type === 'free' ? 'Gratis' : 'Premium'}</p>
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <ProductBadge badge={product.badge} badgeCustom={product.badge_custom} />
            {isSoldOut && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-sm">
                Sold Out
              </span>
            )}
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {product.category && <CategoryBadge category={product.category} />}
              <StockIndicator stockType={product.stock_type} stockQty={product.stock_qty} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-950 leading-tight">{product.title}</h1>
            <div className="mt-3">
              <PriceBlock salePrice={product.sale_price} originalPrice={product.original_price} />
              {product.flash_active && <FlashCountdown endsAt={product.flash_ends_at} className="mt-3" />}
            </div>
          </div>

          {product.description && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-xl font-semibold text-gray-950">Detail Produk</h2>
              <div
                className="rich-content text-base text-gray-700 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
              />
            </section>
          )}

          {previewImages.length > 0 && (
            <section aria-labelledby="preview-title" className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 id="preview-title" className="text-xl font-semibold text-gray-950">Intip Isinya</h2>
              <p className="mt-1 text-xs text-gray-500">Geser untuk melihat, ketuk untuk memperbesar.</p>
              <div className="-mx-1 mt-3 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
                {previewImages.map((url, index) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block w-40 shrink-0 snap-start overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                    <img src={url} alt={`Pratinjau halaman ${index + 1} ${product.title}`} loading="lazy" className="aspect-[3/4] w-full object-cover" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {bundleItems.length > 0 && (
            <section aria-labelledby="bundle-title" className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <h2 id="bundle-title" className="text-xl font-semibold text-gray-950">Isi Paket ({bundleItems.length} produk)</h2>
              {bundleWorth > Number(product.sale_price || 0) && (
                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  Harga satuan {formatRupiah(bundleWorth)} → hemat {formatRupiah(bundleWorth - Number(product.sale_price || 0))}
                </p>
              )}
              <ul className="mt-3 space-y-2">
                {bundleItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-emerald-100">
                    <span className="text-emerald-700" aria-hidden="true">✓</span>
                    <Link href={`/produk/${item.slug}`} className="min-w-0 flex-1 truncate font-medium text-gray-800 hover:text-emerald-700">{item.title}</Link>
                    <span className="shrink-0 text-xs text-gray-400 line-through">{item.type === 'free' ? '' : formatRupiah(item.sale_price)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ProductFAQ faqs={faqs} />

          {product.type !== 'free' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-xl font-semibold text-gray-950">Review dari Pembeli</h2>
              <ProductReviewList productId={product.id} />
            </section>
          )}

          <ShareButtons productUrl={productUrl} title={product.title} />
          <ProductActions
            product={{
              id: product.id,
              title: product.title,
              slug: product.slug,
              type: product.type,
              sale_price: product.sale_price,
              original_price: product.original_price,
              cover_path: product.cover_path,
              stock_type: product.stock_type,
              stock_qty: product.stock_qty,
              description: product.description,
              file_size: product.file_size,
              purchase_button_label: product.purchase_button_label,
              is_link: product.is_link,
              file_name: product.file_name,
            }}
            waUrl={waUrl}
            settings={promo}
          />
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="-mt-16 mb-20">
          <h2 id="related-title" className="mb-2 inline-block rounded-full bg-[#123b35] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            Guru lain juga melihat
          </h2>
          <ProductStack products={related} />
        </section>
      )}
    </LynkShell>
  )
}
