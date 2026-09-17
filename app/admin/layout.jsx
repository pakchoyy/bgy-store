import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url';

  if (!isDemo && !session) {
    redirect('/login');
  }

  const userName = session?.user?.email?.split('@')[0] || 'Admin';

  return (
    <div className="flex min-h-screen flex-col bg-[#edf8f5] bg-[radial-gradient(circle_at_top_left,rgba(46,204,146,0.20),transparent_34rem),linear-gradient(180deg,#f4fbf8_0%,#edf8f5_48%,#f8fafc_100%)] lg:flex-row">
      <Sidebar userName={userName} />
      <div className="flex-1 lg:pl-64">
        <Header userName={userName} />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ userName }) {
  const menuGroups = [
    {
      label: 'Konten',
      items: [
        { href: '/admin/produk', label: 'Produk', icon: 'package' },
        { href: '/admin/kategori', label: 'Kategori', icon: 'tags' },
        { href: '/admin/halaman', label: 'Halaman & Navigasi', icon: 'file-text' },
      ],
    },
    {
      label: 'Tampilan',
      items: [
        { href: '/admin/homepage', label: 'Appearance', icon: 'home' },
        { href: '/admin/footer', label: 'Footer', icon: 'rectangle' },
        { href: '/admin/announcement', label: 'Announcement', icon: 'megaphone' },
      ],
    },
    {
      label: 'Media',
      items: [
        { href: '/admin/media', label: 'Media Library', icon: 'image' },
        { href: '/admin/assets', label: 'Asset Manager', icon: 'database' },
      ],
    },
    {
      label: 'Transaksi',
      items: [
        { href: '/admin/pesanan', label: 'Pesanan', icon: 'shopping-cart' },
      ],
    },
    {
      label: 'Sistem',
      items: [
        { href: '/admin/settings', label: 'Settings', icon: 'settings' },
        { href: '/admin/seo', label: 'SEO', icon: 'search' },
        { href: '/admin/custom-404', label: 'Custom 404', icon: 'alert-circle' },
      ],
    },
  ];

  const mobileItems = [
    { href: '/admin', label: 'Dashboard' },
    ...menuGroups.flatMap((group) => group.items),
  ];

  return (
    <>
    <details className="sticky top-0 z-40 border-b border-emerald-100/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
      <summary className="flex min-h-12 cursor-pointer select-none list-none items-center justify-between rounded-2xl bg-gradient-to-r from-[#27bf82] to-[#51d7b0] px-4 text-sm font-bold text-white shadow-md [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-3">
          <span className="text-xl leading-none">☰</span>
          <span>BGY Admin</span>
        </span>
        <span aria-hidden="true" className="text-white/80">⌄</span>
      </summary>
      <nav aria-label="Menu admin ponsel" className="mt-3 grid max-h-[70vh] grid-cols-1 gap-2 overflow-y-auto rounded-3xl bg-gradient-to-b from-[#2fc78b] to-[#58d7b4] p-3 shadow-xl sm:grid-cols-2">
        {mobileItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl bg-white/20 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/30"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </details>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden bg-gradient-to-b from-[#27bf82] via-[#43cfa0] to-[#66ddb8] text-white shadow-2xl lg:flex">
      <div className="pointer-events-none absolute -left-14 -top-16 h-40 w-40 rounded-full bg-white/12" />
      <div className="pointer-events-none absolute -bottom-10 right-2 h-32 w-32 rounded-full bg-white/10" />
      <Link href="/admin" className="relative flex h-16 items-center gap-3 px-5 transition-colors hover:bg-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 shadow-sm">
          <span className="text-xs font-extrabold text-[#18a873]">BGY</span>
        </div>
        <span className="text-lg font-extrabold tracking-tight">Admin</span>
      </Link>

      <div className="relative mx-4 mb-3 rounded-3xl bg-white/18 p-3 ring-1 ring-white/20">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold uppercase text-[#18a873]">
            {userName?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{userName}</p>
            <p className="truncate text-xs text-white/75">bgy-store admin</p>
          </div>
        </div>
      </div>

      <nav className="relative flex-1 space-y-1 overflow-y-auto p-3">
        <SidebarLink href="/admin" icon="layout-dashboard">Dashboard</SidebarLink>

        {menuGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-[0.8px] text-white/70">
              {group.label}
            </div>
            {group.items.map((item) => (
              <SidebarLink key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </SidebarLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="relative p-4">
        <Link href="/" className="flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 text-sm font-bold text-[#18a873] shadow-sm">
          Lihat Website
        </Link>
      </div>
    </aside>
    </>
  );
}

function Header({ userName }) {
  return (
    <header className="sticky top-0 z-30 hidden h-14 items-center justify-between border-b border-white/70 bg-white/80 px-4 shadow-sm backdrop-blur lg:flex lg:px-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#0ea5a0] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Lihat Website</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-700">
          Dashboard Admin
        </span>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            aria-label="Keluar dari admin"
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors sm:h-auto sm:w-auto sm:gap-1.5 sm:rounded-none sm:hover:bg-transparent"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </form>
      </div>
    </header>
  );
}

function SidebarLink({ href, icon, children }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-white/90 transition-all duration-200 hover:bg-white/20 hover:text-white"
    >
      <span className="flex h-5 w-5 items-center justify-center text-white/85">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon === 'layout-dashboard' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
          {icon === 'package' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
          {icon === 'tags' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />}
          {icon === 'file-text' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
          {icon === 'home' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
          {icon === 'menu' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          {icon === 'rectangle' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />}
          {icon === 'palette' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />}
          {icon === 'megaphone' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />}
          {icon === 'image' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />}
          {icon === 'database' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />}
          {icon === 'link' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />}
          {icon === 'phone' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />}
          {icon === 'shopping-cart' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />}
          {icon === 'settings' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>}
          {icon === 'search' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}
          {icon === 'alert-circle' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
        </svg>
      </span>
      {children}
    </a>
  );
}
