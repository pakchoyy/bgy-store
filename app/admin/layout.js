import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col fixed inset-y-0 left-0 z-40">
        <div className="h-12 flex items-center gap-2 px-4 border-b border-gray-200">
          <div className="w-7 h-7 bg-[#0ea5a0] rounded-lg flex items-center justify-center">
            <span className="text-white font-extrabold text-xs">BGY</span>
          </div>
          <span className="text-sm font-extrabold text-gray-900">Dashboard</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <SidebarLink href="/admin" icon="layout-dashboard">Dashboard</SidebarLink>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.8px] pt-4 pb-1 px-3">Konten</div>
          <SidebarLink href="/admin/produk" icon="package">Produk</SidebarLink>
          <SidebarLink href="/admin/kategori" icon="tags">Kategori</SidebarLink>
          <SidebarLink href="/admin/halaman" icon="file-text">Halaman</SidebarLink>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.8px] pt-4 pb-1 px-3">Tampilan</div>
          <SidebarLink href="/admin/homepage" icon="home">Homepage</SidebarLink>
          <SidebarLink href="/admin/navigation" icon="menu">Navigation</SidebarLink>
          <SidebarLink href="/admin/footer" icon="rectangle">Footer</SidebarLink>
          <SidebarLink href="/admin/theme" icon="palette">Theme</SidebarLink>
          <SidebarLink href="/admin/announcement" icon="megaphone">Announcement</SidebarLink>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.8px] pt-4 pb-1 px-3">Media</div>
          <SidebarLink href="/admin/media" icon="image">Media Library</SidebarLink>
          <SidebarLink href="/admin/assets" icon="database">Asset Manager</SidebarLink>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.8px] pt-4 pb-1 px-3">Data</div>
          <SidebarLink href="/admin/links" icon="link">Link Manager</SidebarLink>
          <SidebarLink href="/admin/contacts" icon="phone">Contact Manager</SidebarLink>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.8px] pt-4 pb-1 px-3">Transaksi</div>
          <SidebarLink href="/admin/pesanan" icon="shopping-cart">Pesanan</SidebarLink>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.8px] pt-4 pb-1 px-3">Sistem</div>
          <SidebarLink href="/admin/settings" icon="settings">Settings</SidebarLink>
          <SidebarLink href="/admin/seo" icon="search">SEO</SidebarLink>
        </nav>
      </aside>
      <div className="flex-1 lg:ml-64">
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <span className="text-sm font-semibold text-gray-700">Dashboard Admin</span>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-gray-500 hover:text-red-600 transition-colors">Keluar</button>
          </form>
        </header>
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, children }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:text-[#0ea5a0] hover:bg-[rgba(14,165,160,0.08)] transition-colors duration-200"
    >
      <span className="w-5 h-5 flex items-center justify-center">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon === 'layout-dashboard' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
          {icon === 'package' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></>}
          {icon === 'tags' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></>}
          {icon === 'file-text' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></>}
          {icon === 'home' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></>}
          {icon === 'menu' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></>}
          {icon === 'rectangle' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" /></>}
          {icon === 'palette' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></>}
          {icon === 'megaphone' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></>}
          {icon === 'image' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></>}
          {icon === 'database' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></>}
          {icon === 'link' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></>}
          {icon === 'phone' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></>}
          {icon === 'shopping-cart' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></>}
          {icon === 'settings' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>}
          {icon === 'search' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></>}
        </svg>
      </span>
      {children}
    </a>
  );
}
