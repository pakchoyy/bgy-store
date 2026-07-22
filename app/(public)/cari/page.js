import AnnouncementBar from '@/components/public/AnnouncementBar';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import ProductCard from '@/components/public/ProductCard';
import SearchInput from '@/components/public/SearchInput';
import Link from 'next/link';
import {
  demoProducts, demoCategories, demoNavItems,
  demoSettings, demoFooterConfig, demoFooterLinks, demoContacts,
} from '@/lib/demo-data';

async function getData() {
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

  if (!hasSupabase) {
    return {
      products: demoProducts.filter((p) => p.is_active),
      categories: demoCategories,
      navItems: demoNavItems,
      settings: demoSettings,
      footerConfig: demoFooterConfig,
      footerLinks: demoFooterLinks,
      contacts: demoContacts,
      announcement: demoSettings.announcement_active === 'true'
        ? { text: demoSettings.announcement_text, url: demoSettings.announcement_url, bgColor: demoSettings.announcement_bg_color, textColor: demoSettings.announcement_text_color }
        : null,
    };
  }

  const { createClient } = await import('@/lib/supabase-server');
  const supabase = await createClient();

  const [
    { data: products },
    { data: categories },
    { data: navItems },
    { data: settingsRows },
    { data: footerConfig },
    { data: footerLinks },
    { data: contacts },
  ] = await Promise.all([
    supabase.from('products').select('*, category:categories(*)').eq('is_active', true).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('navigation_items').select('*').eq('is_visible', true).order('sort_order'),
    supabase.from('settings').select('*'),
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
    products: products || [],
    categories: categories || [],
    navItems: navItems || [],
    settings,
    footerConfig: footerConfig || [],
    footerLinks: footerLinks || [],
    contacts: contacts || [],
    announcement: announcementVisible
      ? { text: settings.announcement_text, url: settings.announcement_url, bgColor: settings.announcement_bg_color, textColor: settings.announcement_text_color }
      : null,
  };
}

export default async function CariPage({ searchParams }) {
  const { q = '', type: filterType = '', category: filterCategory = '' } = searchParams;
  const data = await getData();

  const { products, categories, navItems, settings, footerConfig, footerLinks, contacts, announcement } = data;

  const filtered = products.filter((p) => {
    if (q) {
      const sq = q.toLowerCase();
      if (!p.title.toLowerCase().includes(sq) && !(p.description || '').toLowerCase().includes(sq)) {
        return false;
      }
    }
    if (filterType && p.type !== filterType) return false;
    if (filterCategory && p.category_id !== filterCategory && p.category?.slug !== filterCategory) return false;
    return true;
  });

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {q ? `Hasil pencarian: "${q}"` : 'Cari Produk'}
            </h1>
            <p className="text-gray-600 mt-2">
              {filterType === 'free' ? 'Produk gratis' : filterType === 'paid' ? 'Produk berbayar' : 'Semua produk'}
              {filterCategory && categories.find((c) => c.id === filterCategory || c.slug === filterCategory) ? ` - ${categories.find((c) => c.id === filterCategory || c.slug === filterCategory).name}` : ''}
            </p>
          </div>

          <div className="max-w-md mb-8">
            <SearchInput
              initialValue={q}
              placeholder="Cari produk..."
              onSearch={(val) => {
                const params = new URLSearchParams();
                if (val) params.set('q', val);
                if (filterType) params.set('type', filterType);
                if (filterCategory) params.set('category', filterCategory);
                const path = val || filterType || filterCategory ? `/cari?${params.toString()}` : '/cari';
                window.location.href = path;
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/cari?${new URLSearchParams({
                  ...(q && { q }),
                  ...(filterType && { type: filterType }),
                  category: cat.id === filterCategory || cat.slug === filterCategory ? '' : cat.slug,
                }).toString()}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                  filterCategory === cat.id || filterCategory === cat.slug
                    ? 'text-white border-transparent'
                    : 'text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
                style={filterCategory === cat.id || filterCategory === cat.slug ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 font-medium">Tidak ada hasil</p>
              <p className="text-gray-400 text-sm mt-1">Coba gunakan kata kunci yang berbeda atau hapus filter</p>
              <Link href="/cari" className="inline-block mt-4 text-sm text-[#0ea5a0] font-semibold hover:underline">
                Reset pencarian
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{filtered.length} produk ditemukan</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
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
