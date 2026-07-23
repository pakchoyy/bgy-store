import LynkShell from '@/components/public/LynkShell'
import Link from 'next/link'
import { demoNavItems, demoSettings, demoFooterConfig } from '@/lib/demo-data'
import { getAppearance, settingsToMap } from '@/lib/utils'
import { getAnnouncement, hasSupabase } from '@/lib/store-shell'

const demoPages = {
  'tentang-kami': {
    slug: 'tentang-kami',
    title: 'Tentang Kami',
    content: `<p>Bantu Guru Yuk adalah platform toko digital untuk guru SD Indonesia. Fokus ke materi siap pakai: modul ajar, ATP, media pembelajaran, dan administrasi sekolah.</p>`,
    is_active: true,
  },
  faq: {
    slug: 'faq',
    title: 'FAQ',
    content: `<p>Kunjungi halaman Gratis untuk unduh materi free, atau Produk untuk materi berbayar.</p>`,
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
  return {
    page: page || null,
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
