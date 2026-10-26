'use client'

import { useEffect, useState } from 'react'

const pad = (n) => String(n).padStart(2, '0')

// Hitung mundur ke hari H (event_at). compact = versi kecil untuk kartu.
export default function EventCountdown({ eventAt, compact = false }) {
  const target = new Date(eventAt).getTime()
  const [now, setNow] = useState(null)

  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!eventAt || Number.isNaN(target)) return null
  const dateLabel = new Date(target).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
  const left = now === null ? null : Math.max(0, target - now)
  const done = left === 0
  const d = left === null ? 0 : Math.floor(left / 86400000)
  const h = left === null ? 0 : Math.floor((left % 86400000) / 3600000)
  const m = left === null ? 0 : Math.floor((left % 3600000) / 60000)
  const s = left === null ? 0 : Math.floor((left % 60000) / 1000)

  if (compact) {
    return (
      <span className="block text-xs font-semibold text-amber-700">
        {done ? 'Acara sudah berlangsung' : left === null ? dateLabel : `${d > 0 ? `${d} hari ` : ''}${pad(h)}:${pad(m)}:${pad(s)} lagi`}
      </span>
    )
  }

  return (
    <section className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200" aria-label="Hitung mundur acara">
      <p className="text-sm font-semibold text-amber-900">📅 {dateLabel}</p>
      {done ? (
        <p className="mt-2 text-sm font-bold text-amber-900">Acara sudah berlangsung.</p>
      ) : (
        <div className="mt-3 grid grid-cols-4 gap-2 text-center" aria-live="off">
          {[[d, 'Hari'], [h, 'Jam'], [m, 'Menit'], [s, 'Detik']].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-white py-2 ring-1 ring-amber-200">
              <div className="font-numeric text-2xl font-extrabold text-slate-900">{left === null ? '–' : pad(value)}</div>
              <div className="text-xs font-semibold text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
