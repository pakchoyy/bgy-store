import AnnouncementBar from '@/components/public/AnnouncementBar';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import ProductCard from '@/components/public/ProductCard';
import CategoryBadge from '@/components/public/CategoryBadge';
import {
  demoCategories, demoProducts, demoSections, demoNavItems,
  demoSettings, demoFooterConfig, demoFooterLinks, demoContacts,
} from '@/lib/demo-data';
import Link from 'next/link';

async function getData() {
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

  if (!hasSupabase) {
    const featured = demoProducts.filter((p) => p.is_featured && p.is_active);
    const free = demoProducts.filter((p) => p.type === 'free' && p.is_active).slice(0, 6);
    return {
      sections: demoSections,
      navItems: demoNavItems,
      settings: demoSettings,
      featuredProducts: featured,
      freeProducts: free,
      categories: demoCategories,
      footerConfig: demoFooterConfig,
      footerLinks: demoFooterLinks,
      contacts: demoContacts,
      announcement: { text: demoSettings.announcement_text, url: demoSettings.announcement_url, bgColor: demoSettings.announcement_bg_color, textColor: demoSettings.announcement_text_color },
    };
  }

  const { createClient } = await import('@/lib/supabase-server');
  const supabase = await createClient();

  const [
    { data: sections },
    { data: navItems },
    { data: settingsRows },
    { data: featuredProducts },
    { data: freeProducts },
    { data: categories },
    { data: footerConfig },
    { data: footerLinks },
    { data: contacts },
  ] = await Promise.all([
    supabase.from('homepage_sections').select('*').eq('is_visible', true).order('sort_order'),
    supabase.from('navigation_items').select('*').eq('is_visible', true).order('sort_order'),
    supabase.from('settings').select('*'),
    supabase.from('products').select('*, category:categories(*)').eq('is_featured', true).eq('is_active', true).is('deleted_at', null).order('sort_order'),
    supabase.from('products').select('*, category:categories(*)').eq('type', 'free').eq('is_active', true).is('deleted_at', null).order('created_at', { ascending: false }).limit(6),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('footer_config').select('*'),
    supabase.from('footer_links').select('*').order('sort_order'),
    supabase.from('contacts').select('*'),
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
    sections: sections || [],
    navItems: navItems || [],
    settings,
    featuredProducts: featuredProducts || [],
    freeProducts: freeProducts || [],
    categories: categories || [],
    footerConfig: footerConfig || [],
    footerLinks: footerLinks || [],
    contacts: contacts || [],
    announcement: announcementVisible
      ? {
          text: settings.announcement_text,
          url: settings.announcement_url,
          bgColor: settings.announcement_bg_color,
          textColor: settings.announcement_text_color,
        }
      : null,
  };
}

function HeroSection({ config }) {
  const { title, subtitle, cta_text, cta_url } = config || {};
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f]">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
            {title || 'Bantu Guru Yuk'}
          </h1>
          {subtitle && (
            <p className="text-base md:text-lg text-white/80 leading-relaxed mb-6">
              {subtitle}
            </p>
          )}
          {cta_text && (
            <Link
              href={cta_url || '/free'}
              className="inline-flex items-center gap-2 bg-white text-[#0ea5a0] font-bold px-6 py-3 rounded-xl hover:shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            >
              {cta_text}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedProductsSection({ products }) {
  if (!products?.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Produk Unggulan</h2>
        <Link href="/produk" className="text-sm font-semibold text-[#0ea5a0] hover:text-[#0d7a8a] transition-colors">
          Lihat Semua →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function CategoriesSection({ categories }) {
  if (!categories?.length) return null;
  return (
    <section className="bg-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Kategori</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
              style={{
                backgroundColor: `${cat.color}15`,
                color: cat.color,
                border: `1px solid ${cat.color}30`,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FreeProductsSection({ products }) {
  if (!products?.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Produk Gratis Terbaru</h2>
        <Link href="/free" className="text-sm font-semibold text-[#0ea5a0] hover:text-[#0d7a8a] transition-colors">
          Lihat Semua →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function PromoBannerSection({ config }) {
  if (!config?.image && !config?.text) return null;
  return (
    <section className="bg-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0ea5a0] to-[#2d6a7f]">
          <div className="relative px-6 py-10 md:px-12 md:py-14 text-center">
            {config.text && (
              <p className="text-lg md:text-xl font-bold text-white mb-4">{config.text}</p>
            )}
            {config.cta_text && (
              <Link
                href={config.cta_url || '/'}
                className="inline-flex items-center gap-2 bg-white text-[#0ea5a0] font-bold px-6 py-3 rounded-xl hover:shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-200"
              >
                {config.cta_text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection({ config }) {
  const { title, content } = config || {};
  if (!title && !content) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="max-w-3xl mx-auto text-center">
        {title && (
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        )}
        {content && (
          <p className="text-sm md:text-base text-gray-600 leading-relaxed">{content}</p>
        )}
      </div>
    </section>
  );
}

const sectionComponents = {
  hero: HeroSection,
  featured_products: FeaturedProductsSection,
  categories: CategoriesSection,
  free_products: FreeProductsSection,
  promo_banner: PromoBannerSection,
  about: AboutSection,
};

export default async function HomePage() {
  const data = await getData();

  const { sections, navItems, settings, featuredProducts, freeProducts, categories, footerConfig, footerLinks, contacts, announcement } = data;

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

      <main>
        {sections.map((section) => {
          const Component = sectionComponents[section.key];
          if (!Component) return null;

          const sectionProps = {
            hero: { config: section.config },
            featured_products: { products: featuredProducts },
            categories: { categories },
            free_products: { products: freeProducts },
            promo_banner: { config: section.config },
            about: { config: section.config },
          };

          return <Component key={section.id} {...(sectionProps[section.key] || {})} />;
        })}
      </main>

      <Footer
        config={footerConfig}
        links={footerLinks}
        contacts={contacts}
        siteName={settings.site_name}
      />
    </div>
  );
}
