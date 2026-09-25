'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadMedia } from '@/lib/upload-media'
import { Button } from '@/components/ui/button'

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp']
const DOC_EXT = ['pdf', 'zip', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']

export default function MediaUploadButton() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    const kind = IMAGE_EXT.includes(ext) ? 'cover' : DOC_EXT.includes(ext) ? 'file' : null
    if (!kind) {
      router.push('/admin/media?toast=error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setBusy(true)
    try {
      await uploadMedia(file, kind)
      router.push('/admin/media?toast=success')
      router.refresh()
    } catch {
      router.push('/admin/media?toast=error')
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={busy}
      >
        {busy ? '⏳ Mengunggah...' : '📤 Upload'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        onChange={handleFile}
        disabled={busy}
        className="hidden"
      />
    </>
  )
}
