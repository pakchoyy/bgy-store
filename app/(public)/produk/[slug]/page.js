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

async function getProduct(slug) {
  if (!hasSupabase()) {
    const product = demoProducts.find((p) => p.slug === slug && p.is_active)
    return { ...demoShellData(), product: product || null, faqs: [] }
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

  return { ...shell, product: product || null, faqs }
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
      ...(product.cover_path ? { images: [{ url: product.cover_path }] } : {}),
    },
  }
}

export default async function ProdukDetailPage({ params }) {
  const { slug } = params
  const data = await getProduct(slug)
  const { product, navItems, appearance, footerConfig, announcement, faqs } = data

  if (!product) {
    return (
      <LynkShell appearance={appearance} navItems={navItems} footerConfig={footerConfig} announcement={announcement} topBarTitle="Produk">
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
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bantuguruyuk.web.id'}/produk/${product.slug}`

  return (
    <LynkShell appearance={appearance} navItems={navItems} footerConfig={footerConfig} announcement={announcement} topBarTitle={product.title}>
      <article className="bg-white/95 rounded-[1.6rem] shadow-sm overflow-hidden mb-20 ring-1 ring-white/60">
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

          <section className="rounded-2xl bg-slate-950 px-5 py-6 text-center text-white">
            <h2 className="text-xl font-semibold">Tingkatkan Sekarang</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80">
              Nikmati akses file digital Bantu Guru Yuk dengan proses pembayaran cepat dan tautan unduhan otomatis.
            </p>
          </section>

          <ProductFAQ faqs={faqs} />

          {/* Reviews Section */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-xl font-semibold text-gray-950">Review dari Pembeli</h2>
            <ProductReviewList productId={product.id} />
          </section>

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
            }}
            settings={{}}
          />
        </div>
      </article>
    </LynkShell>
  )
}
