'use client'

import { useState } from 'react'

// Membungkus produk yang disembunyikan di bawah blok; dibuka lewat tombol "Lihat selengkapnya".
export default function ShowMore({ count, children }) {
  const [open, setOpen] = useState(false)
  if (open) return <div className="col-span-6 grid grid-cols-6 gap-2.5 animate-[fadeIn_.25s_ease-out]">{children}</div>
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-expanded="false"
      className="col-span-6 flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-white/80 text-sm font-bold text-emerald-800 shadow-sm ring-1 ring-white transition-transform active:scale-[0.98] hover:bg-white"
    >
      Lihat selengkapnya ({count})
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m6 9 6 6 6-6" /></svg>
    </button>
  )
}
