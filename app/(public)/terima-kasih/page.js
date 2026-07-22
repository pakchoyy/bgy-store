import AnnouncementBar from '@/components/public/AnnouncementBar';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import ProductCard from '@/components/public/ProductCard';
import { demoProducts, demoNavItems, demoSettings, demoFooterConfig, demoFooterLinks, demoContacts } from '@/lib/demo-data';
import Link from 'next/link';

async function getOrder(token) {
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

  if (!hasSupabase || !token) {
    if (!token) return { order: null };
    const demoProduct = demoProducts[0];
    return {
      order: {
        id: 'demo-order-001',
        buyer_name: 'Budi Guru',
        buyer_whatsapp: '6281234567890',
        status: 'paid',
        download_token: 'demo-download-token-abc123',
        token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        product: demoProduct,
        payment: { method: 'qris', paid_at: new Date().toISOString() },
      },
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
    { data: order },
    { data: navItems },
    { data: settingsRows },
    { data: footerConfig },
    { data: footerLinks },
    { data: contacts },
  ] = await Promise.all([
    supabase.from('orders').select('*, product:products(*)').eq('download_token', token).maybeSingle(),
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
    order: order || null,
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

export default async function TerimaKasihPage({ searchParams }) {
  const token = searchParams?.token || '';
  const data = await getOrder(token);
  const { order, navItems, settings, footerConfig, footerLinks, contacts, announcement } = data;

  const recommended = demoProducts.filter((p) => p.is_active && p.id !== order?.product?.id).slice(0, 3);

  const isValid = order && order.status === 'paid' && order.download_token;

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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-16">
          {isValid ? (
            <div className="bg-white rounded-xl shadow-card p-6 md:p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
              <p className="text-gray-600 mb-6">
                Terima kasih, <span className="font-semibold text-gray-900">{order.buyer_name}</span>!
                Pesanan Anda untuk <span className="font-semibold text-gray-900">{order.product?.title || 'Produk'}</span> telah dikonfirmasi.
              </p>
              <Link
                href={`/api/download?token=${order.download_token}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] text-white font-bold px-6 py-3 rounded-xl hover:shadow-md active:scale-[0.98] transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Sekarang
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-card p-6 md:p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Token Tidak Valid</h1>
              <p className="text-gray-600 mb-2">
                Maaf, tautan yang Anda akses tidak valid atau telah kedaluwarsa.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Jika Anda sudah melakukan pembayaran tetapi belum menerima file, silakan hubungi kami melalui WhatsApp.
              </p>
              <a
                href={`https://wa.me/${contacts.find((c) => c.key === 'whatsapp')?.value || '6281234567890'}?text=Halo%20saya%20butuh%20bantuan%20download%20produk`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-600 active:scale-[0.98] transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Hubungi WhatsApp
              </a>
            </div>
          )}

          {recommended.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Produk Lainnya</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommended.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
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
