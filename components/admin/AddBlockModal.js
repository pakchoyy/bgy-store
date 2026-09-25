'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { uploadMedia } from '@/lib/upload-media'

const TITLES = {
  image: 'Add Image',
  text: 'Add Text',
  link: 'Add Link',
}

export default function AddBlockModal({ type, onClose, onCreated }) {
  const { addToast } = useToast()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [imagePath, setImagePath] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!type) return null

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const media = await uploadMedia(file, 'cover')
      setImagePath(media.url)
    } catch (err) {
      addToast(err.message || 'Gagal upload gambar', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (type === 'image' && !imagePath) {
      addToast('Upload gambar dulu', 'error')
      return
    }
    if (type === 'link' && !url.trim()) {
      addToast('URL wajib diisi', 'error')
      return
    }
    if (type === 'text' && !textContent.trim()) {
      addToast('Teks wajib diisi', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_type: type,
          title: title.trim(),
          url: url.trim(),
          text_content: textContent,
          background_color: bgColor,
          image_path: imagePath,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Gagal menambah block')
      addToast(data.demo ? 'Block ditambahkan (mode demo)' : 'Block ditambahkan', 'success')
      onCreated?.(data.block)
      onClose()
    } catch (err) {
      addToast(err.message || 'Gagal menambah block', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 p-4 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-bold">{TITLES[type]}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {type === 'image' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
                {imagePath ? (
                  <img src={imagePath} alt="" className="mx-auto max-h-40 rounded-lg object-cover" />
                ) : (
                  <p className="text-xs text-gray-400 mb-3">Belum ada gambar</p>
                )}
                <label className="mt-3 inline-block">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
                  <span className="inline-flex cursor-pointer items-center rounded-lg bg-[#0ea5a0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d9488]">
                    {uploading ? 'Mengunggah...' : 'Upload Image'}
                  </span>
                </label>
              </div>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Link tujuan saat gambar diklik (opsional)"
                className="mt-3"
              />
            </div>
          )}

          {type === 'link' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title here" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
          )}

          {type === 'text' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (opsional)</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0]"
                  placeholder="Tulis sesuatu..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-9 w-9 rounded border border-gray-200" />
                  <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Menyimpan...' : TITLES[type]}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
