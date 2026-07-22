import AnnouncementBar from '@/components/public/AnnouncementBar';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import ProductCard from '@/components/public/ProductCard';
import SearchInput from '@/components/public/SearchInput';
import {
  demoProducts, demoCategories, demoNavItems,
  demoSettings, demoFooterConfig, demoFooterLinks, demoContacts,
} from '@/lib/demo-data';

async function getData() {
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

  if (!hasSupabase) {
    const paidProducts = demoProducts.filter((p) => p.type === 'paid' && p.is_active);
    return {
      products: paidProducts,
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
    supabase.from('products').select('*, category:categories(*)').eq('type', 'paid').eq('is_active', true).is('deleted_at', null).order('sort_order'),
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

function ProdukPageContent({ searchParams, data }) {
  const { products, categories, navItems, settings, footerConfig, footerLinks, contacts, announcement } = data;
  const q = searchParams?.q || '';
  const cat = searchParams?.category || '';

  const paidCategories = categories.filter((c) =>
    products.some((p) => p.category_id === c.id)
  );

  let filtered = products;
  if (cat) {
    filtered = filtered.filter((p) => p.category_id === cat || p.category?.slug === cat);
  }
  if (q) {
    const sq = q.toLowerCase();
    filtered = filtered.filter((p) => p.title.toLowerCase().includes(sq));
  }

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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Produk Berbayar</h1>
            <p className="text-gray-600 mt-2">Koleksi materi edukasi premium untuk guru SD</p>
          </div>

          <div className="max-w-md mb-6">
            <form action="/produk" method="GET">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Cari produk berbayar..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5a0] focus:border-transparent transition-all duration-200"
                />
              </div>
            </form>
          </div>

          {paidCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <a
                href="/produk"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                  !cat ? 'text-white border-transparent bg-gradient-to-r from-[#0ea5a0] to-[#2d6a7f]' : 'text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                Semua
              </a>
              {paidCategories.map((c) => (
                <a
                  key={c.id}
                  href={`/produk?${new URLSearchParams({ ...(q && { q }), category: c.slug }).toString()}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                    cat === c.slug || cat === c.id
                      ? 'text-white border-transparent'
                      : 'text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                  style={cat === c.slug || cat === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}
                >
                  {c.name}
                </a>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500 font-medium">Tidak ada produk ditemukan</p>
              <p className="text-gray-400 text-sm mt-1">Coba ubah kata kunci atau filter kategori</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{filtered.length} produk ditemukan</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filtered.map((product) => (
                  <div key={product.id} className="relative">
                    <ProductCard product={product} />
                    {product.stock_type === 'limited' && product.stock_qty === 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase z-10">
                        Sold Out
                      </span>
                    )}
                  </div>
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

export default async function ProdukPage({ searchParams }) {
  const data = await getData();
  return <ProdukPageContent searchParams={searchParams} data={data} />;
}
