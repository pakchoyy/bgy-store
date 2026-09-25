'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadMedia } from '@/lib/upload-media'

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp']
const DOC_EXT = ['pdf', 'zip', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']

export default function MediaUploadButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    const kind = IMAGE_EXT.includes(ext) ? 'cover' : DOC_EXT.includes(ext) ? 'file' : null
    if (!kind) {
      router.push('/admin/media?toast=error')
      e.target.value = ''
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
      e.target.value = ''
    }
  }

  return (
    <label className={`bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 ${busy ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {busy ? 'Mengunggah...' : 'Upload'}
      <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={handleFile} disabled={busy} className="hidden" />
    </label>
  )
}
