'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationHref } from '@/lib/navigation';

export default function Navbar({ items, siteName }) {
  const menuButton = useRef(null);
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const pageTitle = pathname === '/'
    ? 'Home'
    : pathname.startsWith('/free')
      ? 'Gratis'
      : pathname.startsWith('/produk')
        ? 'Produk'
        : pathname.startsWith('/cari')
          ? 'Cari'
          : siteName || 'BGY';

  return (
    <>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-3 focus:rounded-lg">Lewati ke konten utama</a>
    <nav onKeyDown={event => { if (event.key === 'Escape') { setIsOpen(false); menuButton.current?.focus(); } }} className="sticky top-0 z-50 bg-slate-950/82 text-white shadow-lg shadow-slate-950/10 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="grid min-h-16 grid-cols-[3rem_1fr_auto] items-center gap-3">
          <button
            ref={menuButton}
            aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={isOpen}
            aria-controls="site-navigation-menu"
            onClick={() => setIsOpen(!isOpen)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-white/90 transition-[background-color,transform] duration-150 hover:bg-white/10 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 5.5h.01M12 12h.01M12 18.5h.01" />}
            </svg>
          </button>

          <Link href="/" className="justify-self-center text-xl font-extrabold tracking-tight text-white">
            {pageTitle}
          </Link>

          <div className="flex items-center justify-end gap-1">
            <Link href="/cari" aria-label="Cari materi" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-white/90 transition-[background-color,transform] duration-150 hover:bg-white/10 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
              </svg>
            </Link>
            <Link href="/produk" aria-label="Keranjang belanja" className="relative flex min-h-11 min-w-11 items-center justify-center rounded-xl text-white/90 transition-[background-color,transform] duration-150 hover:bg-white/10 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20 8H7M10 21h.01M17 21h.01" />
              </svg>
              <span className="absolute right-0 top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-400 px-1 text-xs font-extrabold text-white shadow-sm">0</span>
            </Link>
          </div>
        </div>
      </div>

      {isOpen && (
        <div id="site-navigation-menu" className="border-t border-white/10 bg-slate-950/95">
          <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              aria-current={pathname === '/' ? 'page' : undefined}
              className="mb-2 flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-white/90 hover:bg-white/10"
            >
              {siteName || 'Bantu Guru Yuk'}
            </Link>
            {items?.map((item) => {
              const href = navigationHref(item);
              return (
                <Link
                  key={item.id}
                  href={href}
                  aria-current={pathname === href ? 'page' : undefined}
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-white/80 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav></>
  );
}
