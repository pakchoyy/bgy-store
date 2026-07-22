import AnnouncementBar from '@/components/public/AnnouncementBar';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import Link from 'next/link';
import {
  demoNavItems, demoSettings, demoFooterConfig, demoFooterLinks, demoContacts,
} from '@/lib/demo-data';

async function getData(slug) {
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

  if (!hasSupabase) {
    const demoPages = {
      'tentang-kami': {
        slug: 'tentang-kami',
        title: 'Tentang Kami',
        content: `<h2>Apa Itu Bantu Guru Yuk?</h2>
<p>Bantu Guru Yuk adalah platform penyedia materi edukasi digital untuk guru SD di seluruh Indonesia. Kami berkomitmen untuk membantu para pendidik mendapatkan akses mudah ke modul ajar, ATP, media pembelajaran, dan administrasi sekolah berkualitas.</p>
<h2>Visi Kami</h2>
<p>Menjadi platform edukasi digital terdepan yang mendukung kemajuan pendidikan dasar di Indonesia melalui penyediaan materi ajar yang berkualitas, terjangkau, dan mudah diakses.</p>
<h2>Misi Kami</h2>
<ul>
<li>Menyediakan materi edukasi berkualitas tinggi yang sesuai dengan kurikulum merdeka</li>
<li>Mendukung guru SD Indonesia dengan sumber daya pengajaran yang lengkap</li>
<li>Mengembangkan platform yang ramah pengguna dan mudah diakses</li>
<li>Berkontribusi pada peningkatan kualitas pendidikan dasar di Indonesia</li>
</ul>
<h2>Tim Kami</h2>
<p>Kami adalah sekelompok pendidik, pengembang konten, dan teknolog yang berdedikasi untuk memajukan pendidikan Indonesia. Dengan pengalaman bertahun-tahun di dunia pendidikan, kami memahami kebutuhan guru dan berusaha menyediakan solusi terbaik.</p>`,
        is_active: true,
      },
      faq: {
        slug: 'faq',
        title: 'FAQ - Pertanyaan yang Sering Diajukan',
        content: `<h2>Bagaimana cara mendownload produk gratis?</h2>
<p>Kunjungi halaman <a href="/free">Produk Gratis</a>, pilih produk yang diinginkan, klik tombol "Download Gratis", dan ikuti petunjuk yang muncul. Anda dapat mendukung kami dengan traktir kopi atau langsung mendownload.</p>
<h2>Bagaimana cara membeli produk berbayar?</h2>
<p>Pilih produk di halaman <a href="/produk">Produk Berbayar</a>, klik produk untuk melihat detail, lalu klik tombol "Beli Sekarang". Anda akan diarahkan ke halaman pembayaran untuk menyelesaikan transaksi.</p>
<h2>Apakah file yang didownload aman?</h2>
<p>Semua file yang tersedia di Bantu Guru Yuk telah melalui proses verifikasi. Kami memastikan file bebas dari virus dan malware sebelum diunggah ke platform.</p>
<h2>Bagaimana jika saya menemukan masalah dengan file?</h2>
<p>Silakan hubungi kami melalui WhatsApp atau email yang tercantum di halaman kontak. Kami akan merespon dalam waktu 1x24 jam.</p>
<h2>Apakah saya bisa meminta refund?</h2>
<p>Karena produk yang dijual adalah produk digital, refund hanya dapat dilakukan jika terdapat kerusakan file yang signifikan atau produk tidak sesuai dengan deskripsi. Hubungi kami untuk informasi lebih lanjut.</p>
<h2>Bagaimana cara berkontribusi?</h2>
<p>Jika Anda memiliki materi edukasi yang ingin dibagikan, silakan hubungi tim kami. Kami terbuka untuk kolaborasi dengan guru dan pembuat konten pendidikan.</p>`,
        is_active: true,
      },
      'kebijakan-privasi': {
        slug: 'kebijakan-privasi',
        title: 'Kebijakan Privasi',
        content: `<h2>Informasi yang Kami Kumpulkan</h2>
<p>Kami mengumpulkan informasi yang Anda berikan saat mendaftar, melakukan pembelian, atau menghubungi kami. Informasi ini mencakup nama, alamat email, nomor telepon, dan informasi pembayaran yang diperlukan untuk memproses transaksi.</p>
<h2>Penggunaan Informasi</h2>
<p>Informasi yang kami kumpulkan digunakan untuk: memproses pesanan dan pengiriman file digital, memberikan dukungan pelanggan, mengirimkan pembaruan terkait produk yang Anda beli, meningkatkan kualitas layanan kami.</p>
<h2>Perlindungan Data</h2>
<p>Kami menerapkan langkah-langkah keamanan yang sesuai untuk melindungi informasi pribadi Anda dari akses tidak sah, perubahan, pengungkapan, atau penghancuran.</p>
<h2>Cookie</h2>
<p>Kami menggunakan cookie untuk meningkatkan pengalaman browsing Anda. Cookie membantu kami mengingat preferensi Anda dan memahami bagaimana Anda menggunakan situs kami.</p>
<h2>Perubahan Kebijakan</h2>
<p>Kebijakan privasi ini dapat diperbarui dari waktu ke waktu. Perubahan akan diumumkan melalui situs kami.</p>
<h2>Kontak</h2>
<p>Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui email: hello@bantuguruyuk.web.id</p>`,
        is_active: true,
      },
    };

    const page = demoPages[slug];
    if (page) {
      return {
        page,
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

    return {
      page: null,
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

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  const [
    { data: navItems },
    { data: settingsRows },
    { data: footerConfig },
    { data: footerLinks },
    { data: contacts },
  ] = await Promise.all([
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
    page: page || null,
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

export default async function HalamanPage({ params }) {
  const { slug } = params;
  const data = await getData(slug);

  const { page, navItems, settings, footerConfig, footerLinks, contacts, announcement } = data;

  if (!page) {
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
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-500 mb-6">Halaman tidak ditemukan</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-md active:scale-[0.98] transition-all duration-200">
            Kembali ke Beranda
          </Link>
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{page.title}</h1>
          <div
            className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-[#0ea5a0] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-ul:text-gray-600 prose-li:text-gray-600"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
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
