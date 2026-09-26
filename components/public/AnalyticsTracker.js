'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function send(payload) {
  if (typeof navigator === 'undefined' || navigator.webdriver) return
  const body = JSON.stringify(payload)
  try {
    if (navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) return
  } catch {}
  fetch('/api/track', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {})
}

export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) send({ type: 'view', path: pathname })
  }, [pathname])

  useEffect(() => {
    const onClick = (event) => {
      const target = event.target.closest?.('[data-track-click]')
      if (!target) return
      send({ type: 'click', path: window.location.pathname, product_id: target.getAttribute('data-product-id') || undefined })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
