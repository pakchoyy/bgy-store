'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateSlug } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'

export default function PageForm({ initialData }) {
  const router = useRouter()
  const { addToast } = useToast()
  const isEditing = !!initialData
  const draftKey = isEditing ? `draft_page_${initialData.id}` : 'draft_page_new'

  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    is_active: true,
    meta_title: '',
    meta_description: '',
    ...initialData,
    meta_description: initialData?.meta_description ?? initialData?.meta_desc ?? '',
  })
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedDraft, setSavedDraft] = useState(false)

  useEffect(() => {
    if (!slugManuallyEdited && !isEditing) {
      setForm(prev => ({ ...prev, slug: generateSlug(form.title) }))
    }
  }, [form.title]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setInterval(() => {
      const data = { ...form, _timestamp: Date.now() }
      localStorage.setItem(draftKey, JSON.stringify(data))
      setSavedDraft(true)
    }, 30000)
    return () => clearInterval(timer)
  }, [form, draftKey])

  useEffect(() => {
    if (!isEditing) {
      try {
        const draft = localStorage.getItem(draftKey)
        if (draft) {
          const parsed = JSON.parse(draft)
          if (parsed.title && window.confirm('Ada draft tersimpan. Pulihkan?')) {
            setForm(prev => ({ ...prev, ...parsed, _timestamp: undefined }))
          }
        }
      } catch {}
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/admin/pages', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { ...form, id: initialData.id } : form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan halaman')
      localStorage.removeItem(draftKey)
      addToast(isEditing ? 'Halaman berhasil diperbarui!' : 'Halaman berhasil disimpan!', 'success')
      setTimeout(() => router.push('/admin/halaman'), 1000)
    } catch (err) {
      addToast(err.message, 'error')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {savedDraft && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-700">
            ✓ Draft tersimpan otomatis
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Informasi Halaman</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Judul Halaman</label>
            <Input
              type="text"
              value={form.title}
              onChange={e => updateField('title', e.target.value)}
              placeholder="Masukkan judul halaman"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Slug</label>
            <Input
              type="text"
              value={form.slug}
              onChange={e => { setSlugManuallyEdited(true); updateField('slug', e.target.value) }}
              placeholder="auto-generated-slug"
              className="font-mono"
              required
            />
            <p className="text-xs text-slate-500 mt-1">URL: /halaman/{form.slug || '...'}</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Konten (HTML)</label>
            <Textarea
              value={form.content}
              onChange={e => updateField('content', e.target.value)}
              rows={14}
              placeholder="<h1>Selamat Datang</h1><p>Tulis konten halaman di sini...</p>"
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Status</h3>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={form.is_active}
              onChange={e => updateField('is_active', e.target.checked)}
            />
            <span className="text-sm font-medium">
              {form.is_active ? 'Aktif' : 'Draft'}
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">SEO</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Meta Title</label>
            <Input
              type="text"
              value={form.meta_title}
              onChange={e => updateField('meta_title', e.target.value)}
              placeholder="{title} — Bantu Guru Yuk"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Meta Description</label>
            <Textarea
              value={form.meta_description}
              onChange={e => updateField('meta_description', e.target.value)}
              rows={2}
              placeholder="Deskripsi singkat untuk SEO..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.open(`/halaman/${form.slug}`, '_blank')}>
            👁️ Preview
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Menyimpan...' : isEditing ? 'Perbarui Halaman' : 'Simpan Halaman'}
          </Button>
        </div>
      </div>
    </form>
  )
}
