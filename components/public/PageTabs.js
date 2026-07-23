'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { resolveNavHref } from '@/lib/utils'

export default function PageTabs({ items = [] }) {
  const pathname = usePathname()
  const tabs = (items || []).filter((i) => i.is_visible !== false)

  if (!tabs.length) return null

  return (
    <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-inherit/80 backdrop-blur-sm">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((item) => {
          const href = resolveNavHref(item)
          const active =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={item.id}
              href={href}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                active
                  ? 'bg-white text-[#0d7a8a] shadow-md'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
