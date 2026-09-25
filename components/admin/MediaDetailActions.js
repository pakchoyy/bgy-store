'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MediaDetailActions({ id, url }) {
  const router = useRouter()
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
      router.push('/admin/media?toast=success')
      router.refresh()
    } catch (e) {
      setBusy(false)
      alert(e.message)
    }
  }

  return (
    <div className="flex gap-2 mt-3">
      <button onClick={handleCopy} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium">
        {copied ? 'Tersalin!' : 'Copy URL'}
      </button>
      <button onClick={handleDelete} disabled={busy} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50">
        {busy ? 'Menghapus...' : 'Hapus'}
      </button>
    </div>
  )
}
