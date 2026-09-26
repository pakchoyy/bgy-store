import { sanitizeHtml } from '@/lib/sanitize-html'
import LynkShell from '@/components/public/LynkShell'
import FAQAccordion from '@/components/public/FAQAccordion'
import Link from 'next/link'
import AboutPage from '@/components/public/AboutPage'
import TermsPage from '@/components/public/TermsPage'
import { demoNavItems, demoSettings, demoFooterConfig } from '@/lib/demo-data'
import { getAppearance, settingsToMap, parseSocialLinks } from '@/lib/utils'
import { getAnnouncement, hasSupabase } from '@/lib/store-shell'

const demoPages = {
  'tentang-kami': {
    slug: 'tentang-kami',
    title: 'Tentang Bantu Guru Yuk',
    content: `<h2>Teman Praktis untuk Guru dan Pendidik</h2>
<p>Bantu Guru Yuk hadir untuk membantu guru menyelesaikan berbagai kebutuhan pembelajaran dan administrasi dengan cara yang lebih praktis, sederhana, dan siap digunakan.</p>
<h2>Apa yang Tersedia?</h2>
<p>Guru dapat menemukan modul ajar, ATP, media pembelajaran, administrasi kelas, dan file pendukung lain dalam format digital. Sebagian materi tersedia gratis, sebagian lain berbayar untuk mendukung pengembangan konten yang lebih lengkap.</p>
<h2>Untuk Siapa?</h2>
<p>Platform ini dibuat untuk guru, wali kelas, operator sekolah, dan pendidik yang membutuhkan bahan siap pakai namun tetap mudah disesuaikan dengan kebutuhan kelas masing-masing.</p>`,
    is_active: true,
  },
  'syarat-dan-ketentuan': {
    slug: 'syarat-dan-ketentuan',
    title: 'Syarat & Ketentuan',
    content: `<h2>Produk Digital</h2>
<p>Semua produk Bantu Guru Yuk berupa file digital. Tautan unduhan dikirim otomatis setelah pembayaran berhasil dikonfirmasi.</p>
<h2>Penggunaan</h2>
<p>File boleh digunakan dan disesuaikan untuk kebutuhan pembelajaran dan administrasi pribadi atau sekolah Anda. File tidak boleh dijual ulang, dibagikan secara massal, atau diakui sebagai karya sendiri.</p>
<h2>Pembayaran</h2>
<p>Pembayaran diproses melalui Mayar. Pastikan email dan nomor WhatsApp yang diisi benar agar tautan unduhan bisa diterima.</p>
<h2>Pengembalian Dana</h2>
<p>Karena produk bersifat digital, pembelian yang sudah berhasil tidak dapat dibatalkan. Jika file rusak atau tidak bisa dibuka, hubungi admin dan kami akan membantu mengganti file.</p>
<h2>Kontak</h2>
<p>Pertanyaan dan kendala dapat disampaikan melalui kontak resmi yang tercantum di halaman ini.</p>`,
    is_active: true,
  },
  faq: {
    slug: 'faq',
    title: 'FAQ',
    content: `<h2>Bagaimana cara download produk gratis?</h2>
<p>Buka halaman Gratis, pilih materi yang dibutuhkan, lalu tekan tombol download pada halaman produk.</p>
<h2>Bagaimana cara membeli produk berbayar?</h2>
<p>Buka halaman Produk, pilih produk, lalu tekan tombol Beli Sekarang. Anda akan diarahkan ke pembayaran, kemudian tautan unduhan aktif setelah pembayaran berhasil.</p>
<h2>Apakah ada fitur keranjang?</h2>
<p>Ada. Keranjang dipakai untuk menyimpan produk yang menarik. Checkout tetap dilakukan dari halaman produk agar pembayaran dan tautan unduhan lebih jelas.</p>
<h2>Bagaimana jika file bermasalah?</h2>
<p>Hubungi admin melalui kontak resmi dan sertakan nama produk serta kendala yang dialami.</p>`,
    is_active: true,
  },
}

const faqItems = [
  {
    question: 'Bagaimana cara download produk gratis?',
    answer: 'Buka halaman Gratis, pilih materi yang dibutuhkan, lalu tekan tombol download pada halaman produk.',
  },
  {
    question: 'Bagaimana cara membeli produk berbayar?',
    answer: 'Buka halaman Produk, pilih produk, lalu tekan Beli Sekarang. Anda akan diarahkan ke pembayaran, kemudian tautan unduhan aktif setelah pembayaran berhasil.',
  },
  {
    question: 'Apakah ada fitur keranjang?',
    answer: 'Ada. Keranjang dipakai untuk menyimpan produk yang menarik. Checkout tetap dilakukan dari halaman produk agar pembayaran dan tautan unduhan lebih jelas.',
  },
  {
    question: 'Bagaimana jika file bermasalah?',
    answer: 'Hubungi admin melalui kontak resmi dan sertakan nama produk serta kendala yang dialami.',
  },
]

async function getData(slug) {
  if (!hasSupabase()) {
    return {
      page: demoPages[slug] || null,
      navItems: demoNavItems,
      appearance: getAppearance(demoSettings),
      footerConfig: demoFooterConfig,
      announcement: getAnnouncement(demoSettings),
    }
  }

  const { createClient } = await import('@/lib/supabase-server')
  const supabase = await createClient()

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  const [{ data: navItems }, { data: settingsRows }, { data: footerConfig }] = await Promise.all([
    supabase.from('navigation_items').select('*').eq('is_visible', true).order('sort_order'),
    supabase.from('settings').select('*'),
    supabase.from('footer_config').select('*'),
  ])

  const settings = settingsToMap(settingsRows || [])
  const fallbackPage = demoPages[slug]
  const content = typeof page?.content === 'string' ? page.content.trim() : ''
  const resolvedPage = fallbackPage
    ? { ...fallbackPage, ...(page || {}), title: page?.title?.trim() || fallbackPage.title, content: content || fallbackPage.content }
    : page || null

  return {
    page: resolvedPage,
    navItems: navItems || [],
    appearance: getAppearance(settings),
    footerConfig: footerConfig || [],
    announcement: getAnnouncement(settings),
  }
}

export async function generateMetadata({ params }) {
  const { slug } = params
  const { page } = await getData(slug)
  if (!page) return { title: 'Halaman tidak ditemukan | Bantu Guru Yuk', robots: { index: false } }
  return {
    title: `${page.title} | Bantu Guru Yuk`,
    description: slug === 'tentang-kami'
      ? 'Bantu Guru Yuk adalah teman praktis untuk guru dan pendidik: bahan pembelajaran, tools guru, dan kebutuhan administrasi kelas yang siap digunakan.'
      : (page.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
  }
}

export default async function HalamanPage({ params }) {
  const { slug } = params
  const { page, navItems, appearance, footerConfig, announcement } = await getData(slug)
  const isAbout = slug === 'tentang-kami' && page
  const isTerms = slug === 'syarat-dan-ketentuan' && page
  const wa = parseSocialLinks(appearance?.socialLinks || []).find((l) => l.platform === 'whatsapp')
  const waUrl = wa?.url ? (wa.url.startsWith('http') ? wa.url : `https://wa.me/${wa.url.replace(/\D/g, '')}`) : null

  return (
    <LynkShell
      appearance={appearance}
      navItems={navItems}
      footerConfig={footerConfig}
      announcement={announcement}
      topBarTitle={page?.title || 'Halaman'}
      pageHasHeading
    >
      {isAbout ? <AboutPage /> : isTerms ? <TermsPage waUrl={waUrl} /> : (
      <div className="bg-white/95 rounded-2xl shadow-sm p-5">
        {!page ? (
          <div className="text-center py-8">
            <h1 className="text-lg font-semibold text-gray-900 mb-2">Halaman tidak ditemukan</h1>
            <Link href="/" className="text-sm font-semibold text-[#0ea5a0]">
              Kembali ke Home
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-4">{page.title}</h1>
            {slug === 'faq' ? (
              <FAQAccordion items={faqItems} />
            ) : (
              <div
                className="prose prose-sm max-w-none text-gray-600 prose-headings:font-semibold prose-headings:text-gray-900 prose-p:leading-6"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
              />
            )}
          </>
        )}
      </div>
      )}
    </LynkShell>
  )
}
