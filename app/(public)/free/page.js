import { Suspense } from 'react';
import AnnouncementBar from '@/components/public/AnnouncementBar';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FreePageClient from './FreePageClient';
import {
  demoProducts, demoCategories, demoNavItems,
  demoSettings, demoFooterConfig, demoFooterLinks, demoContacts,
} from '@/lib/demo-data';

async function getData() {
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

  if (!hasSupabase) {
    const freeProducts = demoProducts.filter((p) => p.type === 'free' && p.is_active);
    return {
      products: freeProducts,
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
    supabase.from('products').select('*, category:categories(*)').eq('type', 'free').eq('is_active', true).is('deleted_at', null).order('created_at', { ascending: false }),
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

export default async function FreePage({ searchParams }) {
  const data = await getData();
  const { products, categories, navItems, settings, footerConfig, footerLinks, contacts, announcement } = data;

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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Produk Gratis</h1>
            <p className="text-gray-600 mt-2">Download berbagai materi edukasi untuk guru SD secara gratis</p>
          </div>
          <Suspense fallback={<div className="text-center py-8 text-gray-400">Memuat...</div>}>
            <FreePageClient
              products={products}
              categories={categories}
              settings={settings}
            />
          </Suspense>
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
