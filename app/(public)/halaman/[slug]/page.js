import LynkShell from '@/components/public/LynkShell'
import Link from 'next/link'
import { demoNavItems, demoSettings, demoFooterConfig } from '@/lib/demo-data'
import { getAppearance, settingsToMap } from '@/lib/utils'
import { getAnnouncement, hasSupabase } from '@/lib/store-shell'

const demoPages = {
  'tentang-kami': {
    slug: 'tentang-kami',
    title: 'Tentang Bantu Guru Yuk',
    content: `<h2>Teman Praktis Guru SD</h2>
<p>Bantu Guru Yuk menyediakan materi ajar digital untuk membantu guru menyiapkan pembelajaran dengan lebih cepat, rapi, dan mudah digunakan di kelas.</p>
<h2>Apa yang Tersedia?</h2>
<p>Guru dapat menemukan modul ajar, ATP, media pembelajaran, administrasi kelas, dan file pendukung lain dalam format digital. Sebagian materi tersedia gratis, sebagian lain berbayar untuk mendukung pengembangan konten yang lebih lengkap.</p>
<h2>Untuk Siapa?</h2>
<p>Platform ini dibuat untuk guru SD, wali kelas, operator sekolah, dan pendidik yang membutuhkan bahan siap pakai namun tetap mudah disesuaikan dengan kebutuhan kelas masing-masing.</p>`,
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

export default async function HalamanPage({ params }) {
  const { slug } = params
  const { page, navItems, appearance, footerConfig, announcement } = await getData(slug)

  return (
    <LynkShell
      appearance={appearance}
      navItems={navItems}
      footerConfig={footerConfig}
      announcement={announcement}
      activeTabLabel={page?.title}
    >
      <div className="bg-white/95 rounded-2xl shadow-sm p-5">
        {!page ? (
          <div className="text-center py-8">
            <h1 className="text-lg font-extrabold text-gray-900 mb-2">Halaman tidak ditemukan</h1>
            <Link href="/" className="text-sm font-bold text-[#0ea5a0]">
              Kembali ke Home
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-extrabold text-gray-900 mb-4">{page.title}</h1>
            <div
              className="prose prose-sm max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </>
        )}
      </div>
    </LynkShell>
  )
}
