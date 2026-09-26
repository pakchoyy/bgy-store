'use client'

import { useState } from 'react'
import { formatRupiah } from '@/lib/utils'

export default function RevenueChart({ days }) {
  const [active, setActive] = useState(null)
  const max = Math.max(1, ...days.map((d) => d.total))
  const total = days.reduce((sum, d) => sum + d.total, 0)
  const shown = active === null ? null : days[active]

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100" aria-labelledby="revenue-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="revenue-title" className="font-bold text-slate-700">Pendapatan 30 hari</h2>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatRupiah(total)}</p>
          <p className="text-xs text-slate-500">Produk + traktir kopi yang sudah lunas</p>
        </div>
        <div className="min-h-[40px] text-right text-xs text-slate-500" aria-live="polite">
          {shown && (
            <>
              <p className="font-semibold text-slate-700">{shown.fullLabel}</p>
              <p>{formatRupiah(shown.total)} · {shown.count} transaksi</p>
            </>
          )}
        </div>
      </div>
      <div className="mt-4 flex h-36 items-end gap-[2px] border-b border-slate-200" onMouseLeave={() => setActive(null)}>
        {days.map((day, index) => (
          <button
            key={day.key}
            type="button"
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            aria-label={`${day.fullLabel}: ${formatRupiah(day.total)}, ${day.count} transaksi`}
            className="group flex h-full min-w-0 flex-1 items-end focus:outline-none"
          >
            <span
              className={`block w-full rounded-t-[4px] transition-colors ${active === index ? 'bg-emerald-600' : 'bg-emerald-400 group-hover:bg-emerald-700'} ${day.total === 0 ? 'bg-slate-200' : ''}`}
              style={{ height: day.total ? `${Math.max(4, (day.total / max) * 100)}%` : '2px' }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{days[0]?.fullLabel}</span>
        <span>{days[days.length - 1]?.fullLabel}</span>
      </div>
      <table className="sr-only">
        <caption>Pendapatan harian 30 hari terakhir</caption>
        <thead><tr><th>Tanggal</th><th>Pendapatan</th><th>Transaksi</th></tr></thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.key}><td>{day.fullLabel}</td><td>{formatRupiah(day.total)}</td><td>{day.count}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
