import AnnouncementBar from '@/components/public/AnnouncementBar'
import Footer from '@/components/public/Footer'
import PageTabs from '@/components/public/PageTabs'
import SocialIcons from '@/components/public/SocialIcons'
import { navigationHref } from '@/lib/navigation'

export default function LynkShell({
  appearance,
  navItems,
  footerConfig,
  announcement,
  children,
  activeTabLabel,
  topBarTitle = 'Home',
}) {
  const {
    profileName,
    profileHandle,
    profileAbout,
    profileAvatarUrl,
    bannerUrl,
    bannerEnabled,
    bgColor,
    bgStyle,
    socialLinks,
    siteName,
  } = appearance || {}

  const bg =
    bgStyle === 'flat'
      ? { backgroundColor: bgColor || '#0ea5a0' }
      : {
          backgroundImage: `linear-gradient(180deg, ${bgColor || '#0ea5a0'} 0%, ${bgColor || '#0ea5a0'}cc 35%, #f0fdfa 70%, #f8fafc 100%)`,
        }
  const menuItems = [
    { key: 'home', label: 'Home', href: '/' },
    ...(navItems || []).filter((item) => item.is_visible !== false).map((item) => {
      const href = navigationHref(item)
      return {
        key: item.id || item.label,
        label: item.label === 'Tentang Kami' ? 'FAQ' : item.label,
        href: item.label === 'Tentang Kami' ? '/halaman/faq' : href,
      }
    }),
  ]

  return (
    <div className="min-h-screen" style={bg}>
      {announcement && (
        <AnnouncementBar
          text={announcement.text}
          url={announcement.url}
          bgColor={announcement.bgColor}
          textColor={announcement.textColor}
        />
      )}

      <div className="sticky top-0 z-40 mx-auto flex h-14 max-w-md items-center justify-between bg-[#123b35] px-4 text-white shadow-lg shadow-emerald-950/20">
        <details className="relative">
          <summary aria-label="Buka menu" className="flex h-10 w-10 list-none items-center justify-center rounded-full hover:bg-white/10 [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Menu</span>
            <span aria-hidden="true" className="relative block h-4 w-5 border-y-2 border-white before:absolute before:left-0 before:top-1/2 before:h-0.5 before:w-5 before:-translate-y-1/2 before:bg-white" />
          </summary>
          <div className="absolute left-0 top-12 w-56 overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl ring-1 ring-black/5">
            <p className="border-b border-slate-100 px-4 py-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Pages</p>
            <nav className="max-h-72 overflow-y-auto py-1">
              {menuItems.map((item) => (
                <a key={item.key} href={item.href} className="block px-4 py-3 text-sm font-extrabold hover:bg-slate-50">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </details>
        <p className="text-lg font-extrabold">{topBarTitle}</p>
        <div className="flex items-center gap-1">
          <details className="relative">
            <summary aria-label="Cari produk" className="flex h-10 w-10 list-none items-center justify-center rounded-full hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="m21 21-4.35-4.35m1.1-5.4a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
              </svg>
            </summary>
            <form action="/cari" className="absolute right-0 top-12 flex w-72 gap-2 rounded-2xl bg-white p-3 text-slate-900 shadow-2xl ring-1 ring-black/5">
              <input name="q" type="search" placeholder="Cari produk..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              <button type="submit" className="rounded-xl bg-[#123b35] px-4 py-2 text-sm font-extrabold text-white">Cari</button>
            </form>
          </details>
          <a href="/produk" aria-label="Keranjang belanja" className="relative flex h-10 min-w-12 items-center justify-center gap-1 rounded-full px-2 hover:bg-white/10">
            <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M3 3h2l.5 3m0 0L7 15h10l3-9H5.5Zm3 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            </svg>
            <span className="hidden text-xs font-bold min-[390px]:inline">Cart</span>
            <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-xs font-extrabold text-white">0</span>
          </a>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-8 pb-6">
        <header className="text-center text-white mb-4">
          <div className="w-20 h-20 mx-auto rounded-full border-[3px] border-white/50 shadow-lg overflow-hidden bg-white/20 mb-3">
            {profileAvatarUrl ? (
              <img src={profileAvatarUrl} alt={profileName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-extrabold">
                {(profileName || 'BGY').slice(0, 3).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-lg font-extrabold drop-shadow-sm">{profileName}</h1>
          {profileHandle && (
            <p className="text-sm text-white/85 font-semibold mt-0.5">{profileHandle}</p>
          )}
          {profileAbout && (
            <p className="text-sm text-white/90 mt-2 leading-relaxed max-w-xs mx-auto">
              {profileAbout}
            </p>
          )}
          <SocialIcons links={socialLinks} className="mt-3" />
        </header>

        {bannerEnabled && bannerUrl && (
          <div className="rounded-2xl overflow-hidden shadow-lg mb-4 border border-white/20">
            <img src={bannerUrl} alt="Banner" className="w-full h-auto object-cover" />
          </div>
        )}

        <PageTabs items={navItems} />

        {activeTabLabel && (
          <p className="rounded-lg bg-[#123b35] px-4 py-3 text-center text-sm font-extrabold text-white shadow-sm mt-4 mb-3">
            {activeTabLabel}
          </p>
        )}

        <main className="mt-2">{children}</main>
      </div>

      <Footer config={footerConfig} siteName={siteName || profileName} />
    </div>
  )
}
