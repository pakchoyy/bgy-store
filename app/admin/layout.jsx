import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import AdminMobileNav from '@/components/admin/AdminMobileNav';
import AdminDesktopSidebar from '@/components/admin/AdminDesktopSidebar';

async function getAdminCounts(supabase, isDemo) {
  if (isDemo) return { orders: 0 };
  try {
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'paid']);
    return { orders: count || 0 };
  } catch {
    return { orders: 0 };
  }
}

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url';

  if (!isDemo && !session) {
    redirect('/login');
  }

  const userName = session?.user?.email?.split('@')[0] || 'Admin';
  const counts = await getAdminCounts(supabase, isDemo);

  return (
    <div className="flex min-h-screen flex-col bg-[#edf8f5] bg-[radial-gradient(circle_at_top_left,rgba(46,204,146,0.20),transparent_34rem),linear-gradient(180deg,#f4fbf8_0%,#edf8f5_48%,#f8fafc_100%)] lg:flex-row">
      <Sidebar userName={userName} counts={counts} />
      <div className="flex-1 lg:pl-64">
        <Header userName={userName} />
        <main className="p-4 pb-24 md:p-6 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ userName, counts }) {
  const menuGroups = [
    {
      label: 'Konten',
      items: [
        { href: '/admin/produk', label: 'Produk', icon: 'package' },
        { href: '/admin/pesanan', label: 'Pesanan', icon: 'shopping-cart', countKey: 'orders' },
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
      label: 'Lainnya',
      items: [
        { href: '/admin/media', label: 'Media Library', icon: 'image' },
        { href: '/admin/settings', label: 'Settings', icon: 'settings' },
        { href: '/admin/seo', label: 'SEO', icon: 'search' },
        { href: '/admin/custom-404', label: 'Custom 404', icon: 'alert-circle' },
      ],
    },
  ];

  return (
    <>
    <AdminMobileNav menuGroups={menuGroups} userName={userName} counts={counts} />
    <AdminDesktopSidebar menuGroups={menuGroups} userName={userName} counts={counts} />
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
