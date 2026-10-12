'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Di HP, tabel admin ditampilkan sebagai kartu (lihat .admin-root di globals.css).
// Komponen ini menyalin judul kolom ke setiap sel sebagai label.
export default function MobileTableLabels() {
  const pathname = usePathname()
  useEffect(() => {
    const label = () => {
      document.querySelectorAll('.admin-root table').forEach((table) => {
        const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim())
        if (!heads.length) return
        table.querySelectorAll('tbody tr').forEach((tr) => {
          ;[...tr.children].forEach((td, i) => {
            if (heads[i] && td.getAttribute('data-label') !== heads[i]) td.setAttribute('data-label', heads[i])
          })
        })
      })
    }
    label()
    const observer = new MutationObserver(label)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [pathname])
  return null
}
