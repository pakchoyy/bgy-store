'use client'

import { useEffect, useState } from 'react'
import AnnouncementBar from '@/components/public/AnnouncementBar'
import Footer from '@/components/public/Footer'
import PageTabs from '@/components/public/PageTabs'
import SocialIcons from '@/components/public/SocialIcons'
import { navigationHref, uniqueNavigationItems } from '@/lib/navigation'
import { CART_UPDATED_EVENT, getCartItems } from '@/lib/cart'

function formatCartPrice(value) {
  const amount = Number(value || 0)
  return amount > 0 ? `Rp${amount.toLocaleString('id-ID')}` : 'Gratis'
}

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
    bgImageUrl,
    socialLinks,
    siteName,
  } = appearance || {}
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState([])

  useEffect(() => {
    const syncCart = () => setCartItems(getCartItems())
    syncCart()
    window.addEventListener(CART_UPDATED_EVENT, syncCart)
    window.addEventListener('storage', syncCart)
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart)
      window.removeEventListener('storage', syncCart)
    }
  }, [])

  const bg = bgImageUrl
    ? {
        backgroundColor: bgColor || '#0ea5a0',
        backgroundImage: `${bgStyle === 'flat' ? 'linear-gradient(rgba(255,255,255,.16), rgba(255,255,255,.16))' : `linear-gradient(180deg, ${bgColor || '#0ea5a0'}bb 0%, ${bgColor || '#0ea5a0'}66 35%, #f0fdfa99 75%)`}, url("${bgImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }
    : bgStyle === 'flat'
      ? { backgroundColor: bgColor || '#0ea5a0' }
      : { backgroundImage: `linear-gradient(180deg, ${bgColor || '#0ea5a0'} 0%, ${bgColor || '#0ea5a0'}cc 35%, #f0fdfa 70%, #f8fafc 100%)` }
  const baseNavItems = [
    ...(navItems || []).filter((item) => item.is_visible !== false),
    { id: 'fallback-about', label: 'Tentang', target_url: '/halaman/tentang-kami', is_visible: true },
    { id: 'fallback-faq', label: 'FAQ', target_url: '/halaman/faq', is_visible: true },
  ]
  const rawMenuItems = [
    { key: 'home', label: 'Home', href: '/' },
    ...uniqueNavigationItems(baseNavItems).map((item) => {
      const href = navigationHref(item)
      return {
        key: item.id || item.label,
        label: item.label,
        href,
      }
    }),
  ]
  const seenMenuHrefs = new Set()
  const menuItems = rawMenuItems.filter((item) => {
    if (seenMenuHrefs.has(item.href)) return false
    seenMenuHrefs.add(item.href)
    return true
  })
  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.sale_price || 0), 0)
  const primaryCartItem = cartItems[0]

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
            <span aria-hidden="true" className="relative block h-3.5 w-5 before:absolute before:left-0 before:top-0 before:h-0.5 before:w-5 before:rounded-full before:bg-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-5 after:rounded-full after:bg-white">
              <span className="absolute left-0 top-1.5 h-0.5 w-5 rounded-full bg-white" />
            </span>
          </summary>
          <div className="absolute left-0 top-12 w-56 overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl ring-1 ring-black/5">
            <p className="border-b border-slate-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pages</p>
            <nav className="max-h-72 overflow-y-auto py-1">
              {menuItems.map((item) => (
                <a key={item.key} href={item.href} className="block px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </details>
        <p className="mx-2 min-w-0 flex-1 truncate text-center text-lg font-semibold">{topBarTitle}</p>
        <div className="flex items-center gap-1">
          <details className="relative">
            <summary aria-label="Cari produk" className="flex h-10 w-10 list-none items-center justify-center rounded-full hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="m21 21-4.35-4.35m1.1-5.4a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
              </svg>
            </summary>
            <form action="/cari" className="absolute right-0 top-12 flex w-72 gap-2 rounded-2xl bg-white p-3 text-slate-900 shadow-2xl ring-1 ring-black/5">
              <input name="q" type="search" placeholder="Cari produk..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              <button type="submit" className="rounded-xl bg-[#123b35] px-4 py-2 text-sm font-semibold text-white">Cari</button>
            </form>
          </details>
          <button type="button" onClick={() => setCartOpen(open => !open)} aria-expanded={cartOpen} aria-label={`Keranjang berisi ${cartItems.length} produk`} className="relative flex h-10 min-w-12 items-center justify-center gap-1 rounded-full px-2 hover:bg-white/10">
            <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M3 3h2l.5 3m0 0L7 15h10l3-9H5.5Zm3 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            </svg>
            <span className="hidden text-xs font-semibold min-[390px]:inline">Cart</span>
            {cartItems.length > 0 && <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-xs font-semibold text-white">{cartItems.length}</span>}
          </button>
        </div>
      </div>
      {cartOpen && (
        <div className="fixed inset-0 z-50 md:absolute md:inset-auto md:right-[calc(50%-14rem)] md:top-14 md:w-[min(22rem,calc(100vw-2rem))]">
          <button type="button" aria-label="Tutup keranjang" onClick={() => setCartOpen(false)} className="absolute inset-0 bg-slate-950/55 md:hidden" />
          <section className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-hidden rounded-t-[2rem] bg-white text-slate-900 shadow-2xl ring-1 ring-black/5 md:static md:max-h-none md:rounded-2xl">
            <div className="mx-auto mt-3 h-1.5 w-20 rounded-full bg-slate-200 md:hidden" />
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <svg aria-hidden="true" className="h-8 w-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M3 3h2l.5 3m0 0L7 15h10l3-9H5.5Zm3 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              </svg>
              <div>
                <p className="text-xl font-semibold">Cart ({cartItems.length})</p>
                <p className="text-xs text-slate-500">Pilih produk, lalu lanjut beli.</p>
              </div>
            </div>
            {cartItems.length ? (
              <>
                <div className="max-h-72 overflow-y-auto px-5 py-4">
                  {cartItems.map((item) => (
                    <a key={item.id} href={item.slug ? `/produk/${item.slug}` : '/produk'} className="flex gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:bg-slate-50">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-teal-50 text-[10px] font-bold text-[#0d7a8a]">
                        {item.cover_path ? <img src={item.cover_path} alt="" className="h-full w-full object-cover" /> : 'BGY'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-snug text-slate-900">{item.title}</span>
                        <span className="mt-1 block text-sm font-semibold text-[#0ea5a0]">{formatCartPrice(item.sale_price)}</span>
                      </span>
                      <span className="self-center text-sm font-semibold text-[#0ea5a0]">Beli</span>
                    </a>
                  ))}
                </div>
                <div className="space-y-3 border-t border-slate-100 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-500">Total ({cartItems.length} item)</span>
                    <span className="font-bold text-slate-900">{formatCartPrice(cartTotal)}</span>
                  </div>
                  <a href={primaryCartItem?.slug ? `/produk/${primaryCartItem.slug}` : '/produk'} className="store-buy-button flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0ea5a0] to-[#16c784] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-150 active:scale-[0.96]">
                    Beli Sekarang
                  </a>
                  <a href="/produk" className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-[#0ea5a0] px-4 py-3 text-sm font-semibold text-[#0d7a8a]">
                    Lanjut Belanja
                  </a>
                </div>
              </>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">Keranjang masih kosong</p>
                <a href="/produk" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0ea5a0] px-5 text-sm font-semibold text-white">Lihat Produk</a>
              </div>
            )}
          </section>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 pt-8 pb-6">
        <header className="text-center text-white mb-4">
          <div className="w-20 h-20 mx-auto rounded-full border-[3px] border-white/50 shadow-lg overflow-hidden bg-white/20 mb-3">
            {profileAvatarUrl ? (
              <img src={profileAvatarUrl} alt={profileName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-semibold">
                {(profileName || 'BGY').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 3).toUpperCase() || 'BGY'}
              </div>
            )}
          </div>
          <h1 className="text-lg font-semibold drop-shadow-sm">{profileName}</h1>
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
          <p className="rounded-lg bg-[#123b35] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm mt-4 mb-3">
            {activeTabLabel}
          </p>
        )}

        <main className="mt-2">{children}</main>
      </div>

      <Footer config={footerConfig} siteName={siteName || profileName} />
    </div>
  )
}
