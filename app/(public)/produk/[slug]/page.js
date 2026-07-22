import AnnouncementBar from '@/components/public/AnnouncementBar';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import ProductBadge from '@/components/public/ProductBadge';
import CategoryBadge from '@/components/public/CategoryBadge';
import PriceBlock from '@/components/public/PriceBlock';
import StockIndicator from '@/components/public/StockIndicator';
import ProductFAQ from '@/components/public/ProductFAQ';
import ShareButtons from '@/components/public/ShareButtons';
import FilePreview from '@/components/public/FilePreview';
import StickyBuyBar from '@/components/public/StickyBuyBar';
import { demoProducts, demoNavItems, demoSettings, demoFooterConfig, demoFooterLinks, demoContacts } from '@/lib/demo-data';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getProduct(slug) {
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

  if (!hasSupabase) {
    const product = demoProducts.find((p) => p.slug === slug && p.is_active);
    const faqs = [];
    return {
      product: product || null,
      navItems: demoNavItems,
      settings: demoSettings,
      footerConfig: demoFooterConfig,
      footerLinks: demoFooterLinks,
      contacts: demoContacts,
      faqs,
      announcement: demoSettings.announcement_active === 'true'
        ? { text: demoSettings.announcement_text, url: demoSettings.announcement_url, bgColor: demoSettings.announcement_bg_color, textColor: demoSettings.announcement_text_color }
        : null,
    };
  }

  const { createClient } = await import('@/lib/supabase-server');
  const supabase = await createClient();

  const [
    { data: product },
    { data: navItems },
    { data: settingsRows },
    { data: footerConfig },
    { data: footerLinks },
    { data: contacts },
    { data: faqs },
  ] = await Promise.all([
    supabase.from('products').select('*, category:categories(*)').eq('slug', slug).eq('is_active', true).is('deleted_at', null).single(),
    supabase.from('navigation_items').select('*').eq('is_visible', true).order('sort_order'),
    supabase.from('settings').select('*'),
    supabase.from('footer_config').select('*'),
    supabase.from('footer_links').select('*').order('sort_order'),
    supabase.from('contacts').select('*'),
    supabase.from('product_faqs').select('*').eq('product_slug', slug).order('sort_order'),
  ]);

  const toMap = (arr) => {
    const map = {};
    (arr || []).forEach((row) => { map[row.key] = row.value; });
    return map;
  };

  const settings = toMap(settingsRows || []);
  const announcementActive = settings.announcement_active === 'true';
  const now = new Date();
  const start = settings.announcement_start ? new Date(settings.announcement_start) : null;
  const end = settings.announcement_end ? new Date(settings.announcement_end) : null;
  const announcementVisible = announcementActive && (!start || start <= now) && (!end || end >= now);

  return {
    product: product || null,
    navItems: navItems || [],
    settings,
    footerConfig: footerConfig || [],
    footerLinks: footerLinks || [],
    contacts: contacts || [],
    faqs: faqs || [],
    announcement: announcementVisible
      ? { text: settings.announcement_text, url: settings.announcement_url, bgColor: settings.announcement_bg_color, textColor: settings.announcement_text_color }
      : null,
  };
}

function calcDiscount(original, sale) {
  if (!original || original <= sale) return null;
  return Math.round(((original - sale) / original) * 100);
}

export default async function ProdukDetailPage({ params }) {
  const { slug } = params;
  const data = await getProduct(slug);
  const { product, navItems, settings, footerConfig, footerLinks, contacts, faqs, announcement } = data;

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <Navbar items={navItems} siteName={settings.site_name} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Produk Tidak Ditemukan</h1>
            <p className="text-gray-500 mb-6">Maaf, produk yang Anda cari tidak tersedia atau telah dihapus.</p>
            <Link
              href="/produk"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] text-white font-bold px-6 py-3 rounded-xl hover:shadow-md active:scale-[0.98] transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Lihat Produk Lain
            </Link>
          </div>
        </main>
        <Footer config={footerConfig} links={footerLinks} contacts={contacts} siteName={settings.site_name} />
      </div>
    );
  }

  const isSoldOut = product.stock_type === 'limited' && product.stock_qty <= 0;
  const discountPercent = calcDiscount(product.original_price, product.sale_price);
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bantuguruyuk.web.id'}/produk/${product.slug}`;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {announcement && (
        <AnnouncementBar
          text={announcement.text}
          url={announcement.url}
          bgColor={announcement.bgColor}
          textColor={announcement.textColor}
        />
      )}
      <Navbar items={navItems} siteName={settings.site_name} />
      <main className="pb-24 md:pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">
            <div className="md:col-span-2">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
                {product.cover_path ? (
                  <img
                    src={product.cover_path}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  <ProductBadge badge={product.badge} badgeCustom={product.badge_custom} />
                  {isSoldOut && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Sold Out</span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <FilePreview
                  filePath={product.file_url}
                  previewPath={product.preview_path}
                  mimeType={product.mime_type}
                  fileSize={product.file_size}
                  fileName={product.file_name}
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {product.category && <CategoryBadge category={product.category} />}
                <StockIndicator stockType={product.stock_type} stockQty={product.stock_qty} />
              </div>

              <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3">
                {product.title}
              </h1>

              <div className="mb-4">
                <PriceBlock salePrice={product.sale_price} originalPrice={product.original_price} />
              </div>

              {discountPercent && (
                <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-500 text-xs font-bold px-2.5 py-1 rounded-full mb-4">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hemat {discountPercent}%
                </div>
              )}

              {product.download_count > 0 && (
                <p className="text-xs text-gray-400 mb-4">
                  {product.download_count} unduhan
                </p>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Deskripsi</h3>
                <div
                  className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none prose-headings:text-gray-900 prose-a:text-[#0ea5a0]"
                  dangerouslySetInnerHTML={{ __html: product.description || '' }}
                />
              </div>

              <div className="mb-6">
                <ProductFAQ faqs={faqs} />
              </div>

              <div className="mb-6">
                <ShareButtons productUrl={productUrl} title={product.title} />
              </div>

              <button
                id="main-buy-button"
                disabled={isSoldOut}
                className={`w-full md:w-auto px-8 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 ${
                  isSoldOut
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] hover:shadow-md active:scale-[0.98]'
                }`}
              >
                {isSoldOut ? 'Sold Out' : 'Beli Sekarang'}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer
        config={footerConfig}
        links={footerLinks}
        contacts={contacts}
        siteName={settings.site_name}
      />
      <StickyBuyBar product={product} onBuy={() => {}} />
    </div>
  );
}
