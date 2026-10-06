'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CloseButton } from '@/components/ui/close-button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { uploadMedia } from '@/lib/upload-media'
import { safeUrl } from '@/lib/utils'

const TITLES = {
  image: 'Add Image',
  text: 'Add Text',
  link: 'Add Link',
}

const EDIT_TITLES = {
  image: 'Edit Image',
  text: 'Edit Text',
  link: 'Edit Link',
}

export default function AddBlockModal({ type, initialBlock, onClose, onCreated, onUpdated }) {
  const { addToast } = useToast()
  const isEdit = !!initialBlock?.id
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [transparent, setTransparent] = useState(false)
  const [imagePath, setImagePath] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialBlock) {
      setTitle(initialBlock.title || '')
      setUrl(initialBlock.url || '')
      setTextContent(initialBlock.text_content || '')
      const bg = initialBlock.background_color || '#ffffff'
      setTransparent(bg === 'transparent')
      setBgColor(bg === 'transparent' ? '#ffffff' : bg)
      setImagePath(initialBlock.image_path || '')
    }
  }, [initialBlock?.id])

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
    if (url.trim() && (!/^https?:\/\//i.test(url.trim()) || !safeUrl(url))) {
      addToast('URL harus diawali https:// atau http://', 'error')
      return
    }
    if (type === 'text' && !textContent.trim()) {
      addToast('Teks wajib diisi', 'error')
      return
    }

    setSaving(true)
    try {
      const finalBg = transparent ? 'transparent' : bgColor
      const payload = {
        block_type: type,
        title: title.trim(),
        url: url.trim(),
        text_content: textContent,
        background_color: finalBg,
        image_path: imagePath,
      }
      const isEditMode = !!initialBlock?.id
      const res = await fetch('/api/admin/blocks', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditMode ? { ...payload, id: initialBlock.id } : payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan block')
      if (isEditMode) {
        addToast(data.demo ? 'Block diperbarui (mode demo)' : 'Block diperbarui', 'success')
        onUpdated?.(data.block || { ...initialBlock, ...payload })
      } else {
        addToast(data.demo ? 'Block ditambahkan (mode demo)' : 'Block ditambahkan', 'success')
        onCreated?.(data.block)
      }
      onClose()
    } catch (err) {
      addToast(err.message || 'Gagal menyimpan block', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 pt-[6vh] backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-bold">{isEdit ? (EDIT_TITLES[type] || 'Edit Block') : TITLES[type]}</h2>
          <CloseButton onClick={onClose} />
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
                <RichTextEditor
                  value={textContent}
                  onChange={setTextContent}
                  placeholder="Tulis sesuatu... rata kiri, tengah, kanan, list, link, gambar, emoji didukung"
                  minHeight={180}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    disabled={transparent}
                    className="h-9 w-9 rounded border border-gray-200 disabled:opacity-30"
                  />
                  <Input
                    value={transparent ? 'transparent' : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    disabled={transparent}
                    className="w-36"
                  />
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={transparent}
                      onClick={() => setTransparent(!transparent)}
                      className={`h-5 w-9 rounded-full p-0.5 transition-colors ${transparent ? 'bg-teal-600' : 'bg-slate-200'}`}
                    >
                      <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${transparent ? 'translate-x-4' : ''}`} />
                    </button>
                    Transparent
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Menyimpan...' : isEdit ? (EDIT_TITLES[type] || 'Simpan') : TITLES[type]}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
