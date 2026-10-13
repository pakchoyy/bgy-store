'use client'

import { useEffect } from 'react'

// Halaman error umum: tidak menampilkan detail teknis ke pengunjung.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[app-error]', error?.digest || '', error?.message)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f6] p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
        <img src="/logo-kreacy.svg" alt="" className="mx-auto h-12 w-12" />
        <h1 className="mt-4 text-lg font-bold text-slate-800">Ups, ada kendala</h1>
        <p className="mt-1 text-sm text-slate-500">Halaman belum bisa ditampilkan. Coba muat ulang sebentar lagi.</p>
        {error?.digest && <p className="mt-2 text-[11px] text-slate-400">Kode: {error.digest}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => reset()} className="h-10 rounded-xl bg-emerald-500 text-sm font-semibold text-white">Coba lagi</button>
          <a href="/" className="flex h-10 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-600">Beranda</a>
        </div>
      </div>
    </main>
  )
}
