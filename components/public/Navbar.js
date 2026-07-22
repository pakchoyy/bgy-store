'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar({ items, siteName }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-[#0ea5a0] via-[#0d7a8a] to-[#2d6a7f] sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">BGY</span>
            </div>
            <span className="text-white font-extrabold text-sm hidden sm:block">
              {siteName || 'Bantu Guru Yuk'}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {items?.map((item) => {
              const href = item.target_type === 'external'
                ? item.target_url
                : item.target_type === 'product'
                  ? `/produk/${item.target_id}`
                  : item.target_type === 'category'
                    ? `/kategori/${item.target_id}`
                    : item.target_type === 'page'
                      ? `/halaman/${item.target_id}`
                      : '/';
              return (
                <Link
                  key={item.id}
                  href={href}
                  className="text-white/90 hover:text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors duration-200"
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[#0d7a8a] border-t border-white/10">
          <div className="px-4 py-2 space-y-1">
            {items?.map((item) => {
              const href = item.target_type === 'external'
                ? item.target_url
                : `/`;
              return (
                <Link
                  key={item.id}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className="block text-white/90 hover:text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors duration-200"
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
