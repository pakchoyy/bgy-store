'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

export default function MediaDetailActions({ id, url }) {
  const router = useRouter()
  const { addToast } = useToast()
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard?.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  async function handleDelete() {
    if (!window.confirm('Hapus media ini?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus media')
      addToast('Media berhasil dihapus', 'success')
      router.push('/admin/media')
      router.refresh()
    } catch (e) {
      setBusy(false)
      addToast(e.message, 'error')
    }
  }

  return (
    <div className="flex gap-2 mt-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleCopy}
      >
        {copied ? '✓ Tersalin!' : '📋 Copy URL'}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={busy}
      >
        {busy ? '⏳ Menghapus...' : '🗑️ Hapus'}
      </Button>
    </div>
  )
}
