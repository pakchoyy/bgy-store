'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const MAX_WAIT_MS = 10 * 60 * 1000

export default function PaymentWaiter({ orderId }) {
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [stopped, setStopped] = useState(false)
  const startedAt = useRef(Date.now())

  const check = useCallback(async () => {
    setChecking(true)
    try {
      const response = await fetch(`/api/order-status?order=${encodeURIComponent(orderId)}`, { cache: 'no-store' })
      const data = await response.json()
      if (data.status && data.status !== 'pending' && data.status !== 'unknown') {
        router.refresh()
        return true
      }
    } catch {
    } finally {
      setChecking(false)
    }
    return false
  }, [orderId, router])

  useEffect(() => {
    if (stopped) return
    let timer
    let cancelled = false
    const loop = async () => {
      if (cancelled) return
      if (await check()) return
      const elapsed = Date.now() - startedAt.current
      if (elapsed > MAX_WAIT_MS) {
        setStopped(true)
        return
      }
      timer = setTimeout(loop, elapsed < 2 * 60 * 1000 ? 5000 : 15000)
    }
    timer = setTimeout(loop, 3000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [check, stopped])

  return (
    <div className="mt-4 space-y-2">
      <p role="status" className="inline-flex items-center gap-2 text-xs font-medium text-gray-500">
        <span className={`h-2 w-2 rounded-full ${stopped ? 'bg-gray-300' : 'animate-pulse bg-amber-400'}`} aria-hidden="true" />
        {stopped ? 'Pengecekan otomatis berhenti.' : 'Mengecek pembayaran otomatis...'}
      </p>
      <button
        type="button"
        onClick={async () => {
          const done = await check()
          if (!done && stopped) {
            startedAt.current = Date.now()
            setStopped(false)
          }
        }}
        disabled={checking}
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-[background-color,transform] duration-150 hover:bg-emerald-600 active:scale-[0.97] disabled:opacity-70"
      >
        {checking ? 'Mengecek...' : 'Saya sudah bayar, cek sekarang'}
      </button>
    </div>
  )
}
