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

function waPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

function thankYouLink(token) {
  return `${window.location.origin}/terima-kasih?token=${encodeURIComponent(token)}`
}

export function FollowUpButton({ order }) {
  const handleClick = () => {
    const phone = waPhone(order.whatsapp)
    if (!phone) return
    const message = order.status === 'paid'
      ? `Halo ${order.buyer_name}, terima kasih sudah membeli *${order.product_title}* di Bantu Guru Yuk 🙏${order.download_token ? `\n\nFile bisa diunduh di sini (berlaku 7 hari):\n${thankYouLink(order.download_token)}` : ''}\n\nKalau ada kendala, balas pesan ini ya.`
      : `Halo ${order.buyer_name}, pesanan *${order.product_title}* kamu masih menunggu pembayaran. Ada yang bisa kami bantu?`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }
  return (
    <Button size="sm" variant="outline" onClick={handleClick}>
      💬 {order.status === 'paid' ? 'Kirim link download via WA' : 'Follow Up WA'}
    </Button>
  )
}

export function CopyLinkButton({ downloadToken }) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    if (!downloadToken) return
    try {
      await navigator.clipboard.writeText(thankYouLink(downloadToken))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={!downloadToken}>
      {copied ? '✓ Tersalin!' : '📋 Salin link download'}
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
