'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, isActive } from './AdminMobileNav';

function SidebarLink({ href, icon, children, count }) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-all duration-150 ${
        active
          ? 'bg-white text-[#18a873] shadow-sm'
          : 'text-white/90 hover:bg-white/20 hover:text-white'
      }`}
    >
      <Icon name={icon} />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count > 0 && (
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

export default function AdminDesktopSidebar({ menuGroups, counts = {} }) {
  return (
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
            A
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Admin BGY Store</p>
            <p className="truncate text-xs text-white/75">Kelola toko digital</p>
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
              <SidebarLink key={item.href} href={item.href} icon={item.icon} count={item.countKey ? counts[item.countKey] : item.count}>
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
  );
}
