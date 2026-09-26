'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button size="sm" variant="outline" onClick={() => window.print()}>
      🖨️ Print
    </Button>
  )
}

export function FollowUpButton({ order }) {
  const handleClick = () => {
    const phone = String(order.whatsapp || '').replace(/\D/g, '')
    if (!phone) return
    const message = order.status === 'paid'
      ? `Halo ${order.buyer_name}, terima kasih sudah membeli ${order.product_title}! Ada yang bisa kami bantu?`
      : `Halo ${order.buyer_name}, kami lihat pesanan ${order.product_title} kamu masih pending. Butuh bantuan menyelesaikan pembayaran?`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }
  return (
    <Button size="sm" variant="outline" onClick={handleClick}>
      💬 Follow Up
    </Button>
  )
}

export function CopyLinkButton({ downloadToken }) {
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
    <Button size="sm" variant="outline" onClick={handleClick} disabled={!downloadToken}>
      {copied ? '✓ Tersalin!' : '📋 Copy Link'}
    </Button>
  )
}

export function ConfirmSubmitButton({ message, children, className = '', ...props }) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault()
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}
