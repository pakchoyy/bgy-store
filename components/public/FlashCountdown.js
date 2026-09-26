'use client'

import { useEffect, useState } from 'react'

function remaining(endsAt) {
  const ms = new Date(endsAt).getTime() - Date.now()
  if (!(ms > 0)) return null
  const total = Math.floor(ms / 1000)
  const days = Math.floor(total / 86400)
  const pad = (n) => String(n).padStart(2, '0')
  const hms = `${pad(Math.floor((total % 86400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
  return days > 0 ? `${days} hari ${hms}` : hms
}

export default function FlashCountdown({ endsAt, className = '' }) {
  const [label, setLabel] = useState(null)

  useEffect(() => {
    const tick = () => setLabel(remaining(endsAt))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [endsAt])

  if (!endsAt) return null
  return (
    <div className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-2 text-white shadow-sm ${className}`}>
      <span className="text-lg" aria-hidden="true">⚡</span>
      <span className="text-sm font-bold">Flash sale</span>
      <span className="ml-auto font-numeric text-sm font-bold tabular-nums" role="timer" aria-live="off">
        {label === null ? 'Berakhir' : `Berakhir ${label}`}
      </span>
    </div>
  )
}
