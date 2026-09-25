'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadMedia } from '@/lib/upload-media'

export default function AssetUploadCard({ slotKey, currentUrl }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const media = await uploadMedia(file, 'cover')
      const res = await fetch('/api/admin/assets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: slotKey, media_id: media.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan asset')
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  async function handleDelete() {
    if (!window.confirm('Hapus asset ini?')) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/assets?key=${encodeURIComponent(slotKey)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus asset')
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {error && <p className="text-[10px] font-medium text-red-600">{error}</p>}
      <div className="flex gap-2">
        <label className={`flex-1 text-center text-xs text-white px-3 py-1.5 rounded-lg font-medium transition-colors ${busy ? 'bg-gray-300 cursor-wait' : 'bg-[#0ea5a0] hover:bg-[#0d7a8a] cursor-pointer'}`}>
          {busy ? 'Mengunggah...' : 'Replace'}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} disabled={busy} className="hidden" />
        </label>
        {currentUrl && (
          <button type="button" onClick={handleDelete} disabled={busy} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50">
            Hapus
          </button>
        )}
      </div>
    </div>
  )
}
