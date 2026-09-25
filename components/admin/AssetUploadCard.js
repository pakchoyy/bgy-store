'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadMedia } from '@/lib/upload-media'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'

export default function AssetUploadCard({ slotKey, currentUrl }) {
  const router = useRouter()
  const { addToast } = useToast()
  const fileInputRef = useRef(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const media = await uploadMedia(file, 'cover')
      const res = await fetch('/api/admin/assets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: slotKey, media_id: media.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan asset')
      addToast('Asset berhasil diperbarui', 'success')
      router.refresh()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete() {
    if (!window.confirm('Hapus asset ini?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/assets?key=${encodeURIComponent(slotKey)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus asset')
      addToast('Asset berhasil dihapus', 'success')
      router.refresh()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          {busy ? '⏳ Mengunggah...' : '📤 Replace'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFile}
          disabled={busy}
          className="hidden"
        />
        {currentUrl && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={busy}
          >
            🗑️ Hapus
          </Button>
        )}
      </div>
    </div>
  )
}
