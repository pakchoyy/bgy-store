import Link from 'next/link';

export default function AdminTabs({ tabs, active }) {
  return (
    <nav aria-label="Sub menu" className="mb-6 flex w-full gap-1 overflow-x-auto rounded-xl bg-white/80 p-1 shadow-sm ring-1 ring-slate-100 sm:w-fit">
      {tabs.map((tab) => {
        const current = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={current ? 'page' : undefined}
            className={`flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-sm font-bold transition-colors ${current ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-800'}`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${current ? 'bg-white text-emerald-800' : 'bg-red-500 text-white'}`}>{tab.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export const APPEARANCE_TABS = [
  { id: 'appearance', label: 'Appearance', href: '/admin/homepage' },
  { id: 'theme', label: 'Tema Warna', href: '/admin/theme' },
];

export const ACTIVITY_TABS = [
  { id: 'reviews', label: 'Review', href: '/admin/reviews' },
  { id: 'notifikasi', label: 'Notifikasi', href: '/admin/notifikasi' },
];

export const PAGE_404_TABS = [
  { id: '404', label: 'Custom 404', href: '/admin/custom-404' },
  { id: 'error-log', label: 'Error Log', href: '/admin/error-log' },
];

export const VOUCHER_TABS = [
  { id: 'voucher', label: '🎟️ Voucher', href: '/admin/voucher' },
  { id: 'kupon', label: '🎁 Kupon Download', href: '/admin/voucher?tab=kupon' },
];
