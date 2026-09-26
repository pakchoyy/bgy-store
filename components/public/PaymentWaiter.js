'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentWaiter({ orderId }) {
  const router = useRouter()
  const [checks, setChecks] = useState(0)

  useEffect(() => {
    let stopped = false
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/order-status?order=${encodeURIComponent(orderId)}`, { cache: 'no-store' })
        const data = await response.json()
        if (stopped) return
        setChecks((value) => value + 1)
        if (data.status && data.status !== 'pending') {
          clearInterval(timer)
          router.refresh()
        }
      } catch {}
    }, 4000)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [orderId, router])

  return (
    <p role="status" className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-gray-500">
      <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" aria-hidden="true" />
      {checks < 30 ? 'Mengecek pembayaran otomatis...' : 'Masih menunggu konfirmasi dari Mayar...'}
    </p>
  )
}
