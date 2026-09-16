'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { resolveNavHref } from '@/lib/utils'

export default function PageTabs({ items = [] }) {
  const pathname = usePathname()
  const seen = new Set()
  const baseItems = [
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
    <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-inherit/80 backdrop-blur-sm">
      <div className="flex flex-wrap justify-center gap-2 pb-1">
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
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                active
                  ? 'bg-white text-[#0d7a8a] shadow-md'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
