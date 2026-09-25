'use client'

import { useState } from 'react'

export function PrintButton({ className }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6v-7Z" />
      </svg>
      Print
    </button>
  )
}

export function FollowUpButton({ order, className }) {
  const handleClick = () => {
    const phone = String(order.whatsapp || '').replace(/\D/g, '')
    if (!phone) return
    const message = order.status === 'paid'
      ? `Halo ${order.buyer_name}, terima kasih sudah membeli ${order.product_title}! Ada yang bisa kami bantu?`
      : `Halo ${order.buyer_name}, kami lihat pesanan ${order.product_title} kamu masih pending. Butuh bantuan menyelesaikan pembayaran?`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }
  return (
    <button type="button" onClick={handleClick} className={className}>
      Send Follow Up Text via WhatsApp
    </button>
  )
}

export function CopyLinkButton({ downloadToken, className }) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    if (!downloadToken) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/api/download?token=${downloadToken}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <button type="button" onClick={handleClick} disabled={!downloadToken} className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}>
      {copied ? 'Tersalin!' : 'Copy Link'}
    </button>
  )
}
