'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { resolveNavHref } from '@/lib/utils'

export default function PageTabs({ items = [] }) {
  const pathname = usePathname()
  const seen = new Set()
  const baseItems = [
    { id: 'fallback-home', label: 'Beranda', target_url: '/', is_visible: true },
    ...(items || []),
    { id: 'fallback-faq', label: 'FAQ', target_url: '/halaman/faq', is_visible: true },
  ]
  const tabs = baseItems.filter((item) => {
    if (item.is_visible === false) return false
    const href = resolveNavHref(item).replace(/\/+$/, '') || '/'
    if (href === '/halaman/tentang-kami') return false
    if (seen.has(href)) return false
    seen.add(href)
    return true
  })

  if (!tabs.length) return null

  return (
    <nav aria-label="Halaman toko" className="py-2">
      {/* Satu baris rata lebar seperti tombol segmen; lebih dari 4 tab bisa digeser */}
      <div className={`rounded-full bg-black/10 p-1 ${tabs.length > 4 ? 'flex gap-1 overflow-x-auto [scrollbar-width:none]' : 'grid grid-flow-col auto-cols-fr gap-1'}`}>
        {tabs.map((item) => {
          const href = resolveNavHref(item).replace(/\/+$/, '') || '/'
          const label = item.label
          const active =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={item.id}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex h-11 min-w-0 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 text-sm font-semibold transition-colors duration-150 ${
                active
                  ? 'bg-white text-[#0d7a8a] shadow-sm'
                  : 'text-white hover:bg-white/15'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
