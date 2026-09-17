'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const iconPaths = {
  menu: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />,
  logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />,
  'layout-dashboard': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6" />,
  package: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6" />,
  'shopping-cart': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />,
  tags: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 0 1 0 2.828l-7 7a2 2 0 0 1-2.828 0l-7-7A1.994 1.994 0 0 1 3 12V7a4 4 0 0 1 4-4Z" />,
  'file-text': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />,
  rectangle: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm0 8a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6Z" />,
  megaphone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 0 1-3.417.592l-2.147-6.15M18 13a3 3 0 1 0 0-6M5.436 13.683A4.001 4.001 0 0 1 7 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 0 1-1.564-.317Z" />,
  image: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4 16 4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />,
  database: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />,
  settings: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></>,
  search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />,
  'alert-circle': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
};

export function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {iconPaths[name] || iconPaths['layout-dashboard']}
    </svg>
  );
}

export function isActive(pathname, href) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminMobileNav({ menuGroups, counts = {} }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const bottomItems = [
    { href: '/admin', label: 'Home', icon: 'layout-dashboard' },
    { href: '/admin/produk', label: 'Produk', icon: 'package' },
    { href: '/admin/pesanan', label: 'Pesanan', icon: 'shopping-cart', count: counts.orders },
    { href: '/admin/homepage', label: 'Tampilan', icon: 'home' },
  ];
  const activeBottom = bottomItems.find((item) => isActive(pathname, item.href));
  const title = activeBottom?.label || menuGroups.flatMap((group) => group.items).find((item) => isActive(pathname, item.href))?.label || 'Admin';
  const allGroups = useMemo(() => [
    { label: 'Utama', items: [{ href: '/admin', label: 'Dashboard', icon: 'layout-dashboard' }] },
    ...menuGroups,
  ], [menuGroups]);

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-40 border-b border-emerald-100/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#27bf82] to-[#51d7b0] px-3 text-white shadow-md">
          <button type="button" onClick={() => setOpen(true)} aria-label="Buka menu admin" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 transition-transform duration-150 active:scale-[0.96]">
            <Icon name="menu" className="h-6 w-6" />
          </button>
          <p className="min-w-0 flex-1 truncate text-center text-sm font-extrabold">{title}</p>
          <form action="/auth/signout" method="post">
            <button type="submit" aria-label="Keluar dari admin" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm transition-transform duration-150 active:scale-[0.96]">
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Tutup menu admin" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/45" />
          <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col overflow-hidden bg-gradient-to-b from-[#27bf82] via-[#43cfa0] to-[#66ddb8] text-white shadow-2xl">
            <div className="pointer-events-none absolute -left-14 -top-16 h-40 w-40 rounded-full bg-white/12" />
            <div className="relative flex min-h-16 items-center gap-3 px-4">
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu admin" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 transition-transform duration-150 active:scale-[0.96]">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              <p className="text-xl font-extrabold tracking-tight">Admin</p>
            </div>
            <nav aria-label="Menu admin" className="relative flex-1 space-y-1 overflow-y-auto px-3 pb-5">
              {allGroups.map((group) => (
                <div key={group.label}>
                  <div className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-[0.8px] text-white/70">
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-colors ${active ? 'bg-white text-[#18a873] shadow-sm' : 'text-white/90 hover:bg-white/20 hover:text-white'}`}
                      >
                        <Icon name={item.icon} />
                        <span>{item.label}</span>
                        {item.count > 0 && (
                          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-red-500 text-white' : 'bg-red-500 text-white'}`}>
                            {item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <nav aria-label="Menu cepat admin" className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {bottomItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition-colors ${active ? 'bg-[#0ea5a0] text-white shadow-sm' : 'text-slate-500 hover:bg-emerald-50 hover:text-[#0d7a8a]'}`}>
                <span className="relative">
                  <Icon name={item.icon} className="h-5 w-5" />
                  {item.count > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {item.count}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold text-slate-500 transition-colors hover:bg-emerald-50 hover:text-[#0d7a8a]" aria-label="Buka menu lainnya">
            <Icon name="menu" className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
