'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseSocialLinks } from '@/lib/utils'
import { themeFonts } from '@/lib/store-theme'
import { uploadMedia } from '@/lib/upload-media'
import AdminToast from '@/components/admin/AdminToast'

const PLATFORMS = [
  'whatsapp',
  'tiktok',
  'instagram',
  'email',
  'youtube',
  'telegram',
  'facebook',
  'website',
]

function uid() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const inputCls =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0]'

export default function AppearanceBuilder({
  initialAppearance,
  navItems = [],
  products = [],
  siteName = 'BGY',
}) {
  const router = useRouter()
  const [form, setForm] = useState(() => ({
    profile_name: initialAppearance.profileName || siteName,
    profile_handle: initialAppearance.profileHandle || '@bgy',
    profile_about: initialAppearance.profileAbout || '',
    profile_avatar_url: initialAppearance.profileAvatarUrl || '',
    banner_url: initialAppearance.bannerUrl || '',
    banner_enabled: initialAppearance.bannerEnabled !== false,
    bg_color: initialAppearance.bgColor || '#0ea5a0',
    bg_style: initialAppearance.bgStyle || 'gradient',
    bg_image_url: initialAppearance.bgImageUrl || '',
    theme_font: initialAppearance.themeFont || 'system',
    theme_primary_color: initialAppearance.themePrimaryColor || '#0ea5a0',
    theme_secondary_color: initialAppearance.themeSecondaryColor || '#0d7a8a',
    theme_border_radius: initialAppearance.themeBorderRadius || 'rounded',
    theme_button_style: initialAppearance.themeButtonStyle || 'solid',
    social_links: parseSocialLinks(initialAppearance.socialLinks || []),
  }))
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [uploading, setUploading] = useState('')

  const previewProducts = useMemo(
    () => products.filter((p) => p.is_active).slice(0, 6),
    [products]
  )

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 2500)
  }

  function addSocial(platform) {
    setForm((prev) => ({
      ...prev,
      social_links: [...prev.social_links, { id: uid(), platform, url: '' }],
    }))
  }

  function updateSocial(id, patch) {
    setForm((prev) => ({
      ...prev,
      social_links: prev.social_links.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }))
  }

  function removeSocial(id) {
    setForm((prev) => ({
      ...prev,
      social_links: prev.social_links.filter((s) => s.id !== id),
    }))
  }

  async function handleImageUpload(event, settingKey) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(settingKey)
    try {
      const media = await uploadMedia(file, 'cover')
      update(settingKey, media.url)
      showToast('success', 'Foto berhasil diunggah. Simpan perubahan untuk menerapkan.')
    } catch (error) {
      showToast('error', error?.message || 'Foto gagal diunggah.')
    } finally {
      setUploading('')
      event.target.value = ''
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            profile_name: form.profile_name,
            profile_handle: form.profile_handle,
            profile_about: form.profile_about,
            profile_avatar_url: form.profile_avatar_url,
            banner_url: form.banner_url,
            banner_enabled: form.banner_enabled ? 'true' : 'false',
            bg_color: form.bg_color,
            bg_style: form.bg_style,
            bg_image_url: form.bg_image_url,
            theme_font: form.theme_font,
            theme_primary_color: form.theme_primary_color,
            theme_secondary_color: form.theme_secondary_color,
            theme_border_radius: form.theme_border_radius,
            theme_button_style: form.theme_button_style,
            social_links: JSON.stringify(form.social_links),
            site_name: form.profile_name,
            site_tagline: form.profile_about,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast('error', data.error || 'Gagal menyimpan')
      } else {
        showToast('success', data.demo ? 'Mode demo — tidak ke DB' : 'Appearance tersimpan!')
        router.refresh()
      }
    } catch (e) {
      showToast('error', e.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">Appearance</h1>
          <p className="text-sm text-gray-500">Profil, banner, sosmed — gaya Lynk</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            className="text-sm font-semibold text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Lihat Website
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !!uploading}
            className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-bold px-5 py-2 rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      <AdminToast toast={toast?.type} message={toast?.msg} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Profil</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nama tampilan">
                <input
                  value={form.profile_name}
                  onChange={(e) => update('profile_name', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Handle / username">
                <input
                  value={form.profile_handle}
                  onChange={(e) => update('profile_handle', e.target.value)}
                  className={inputCls}
                  placeholder="@bgy"
                />
              </Field>
            </div>
            <Field label="About (singkat)">
              <textarea
                rows={3}
                value={form.profile_about}
                onChange={(e) => update('profile_about', e.target.value)}
                className={`${inputCls} resize-y`}
                placeholder="Penjelasan singkat toko..."
              />
            </Field>
            <ImageUpload label="Foto profil" value={form.profile_avatar_url} uploading={uploading === 'profile_avatar_url'} onChange={(e) => handleImageUpload(e, 'profile_avatar_url')} onRemove={() => update('profile_avatar_url', '')} />
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Banner</h2>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.banner_enabled}
                  onChange={(e) => update('banner_enabled', e.target.checked)}
                  className="rounded text-[#0ea5a0]"
                />
                Tampilkan
              </label>
            </div>
            <ImageUpload label="Banner (1200 x 628 disarankan)" value={form.banner_url} uploading={uploading === 'banner_url'} onChange={(e) => handleImageUpload(e, 'banner_url')} onRemove={() => update('banner_url', '')} />
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Background</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Warna">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.bg_color}
                    onChange={(e) => update('bg_color', e.target.value)}
                    className="w-12 h-10 rounded border border-gray-200"
                  />
                  <input
                    value={form.bg_color}
                    onChange={(e) => update('bg_color', e.target.value)}
                    className={`${inputCls} flex-1 font-mono`}
                  />
                </div>
              </Field>
              <Field label="Style">
                <select
                  value={form.bg_style}
                  onChange={(e) => update('bg_style', e.target.value)}
                  className={inputCls}
                >
                  <option value="gradient">Gradient</option>
                  <option value="flat">Flat Color</option>
                </select>
              </Field>
            </div>
            <ImageUpload label="Foto latar" value={form.bg_image_url} uploading={uploading === 'bg_image_url'} onChange={(e) => handleImageUpload(e, 'bg_image_url')} onRemove={() => update('bg_image_url', '')} />
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Font & tombol</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Font halaman">
                <select value={form.theme_font} onChange={(e) => update('theme_font', e.target.value)} className={inputCls}>
                  {Object.entries(themeFonts).map(([name, font]) => <option key={name} value={name} style={{ fontFamily: font }}>{name === 'system' ? 'Sistem' : name}</option>)}
                </select>
              </Field>
              <Field label="Bentuk sudut">
                <select value={form.theme_border_radius} onChange={(e) => update('theme_border_radius', e.target.value)} className={inputCls}>
                  <option value="rounded">Bulat</option><option value="slightly">Sedikit bulat</option><option value="square">Kotak</option>
                </select>
              </Field>
              <Field label="Warna tombol utama">
                <ColorField value={form.theme_primary_color} onChange={(value) => update('theme_primary_color', value)} />
              </Field>
              <Field label="Warna tombol kedua">
                <ColorField value={form.theme_secondary_color} onChange={(value) => update('theme_secondary_color', value)} />
              </Field>
            </div>
            <Field label="Gaya tombol beli">
              <div className="grid grid-cols-3 gap-2">
                {[['solid', 'Penuh'], ['outline', 'Outline'], ['soft', 'Lembut']].map(([value, label]) => (
                  <button key={value} type="button" aria-pressed={form.theme_button_style === value} onClick={() => update('theme_button_style', value)} className={`min-h-11 rounded-lg border px-3 text-sm font-semibold ${form.theme_button_style === value ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-gray-200 text-gray-600'}`}>{label}</button>
                ))}
              </div>
            </Field>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-gray-900">Social Links</h2>
              <div className="flex flex-wrap gap-1">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => addSocial(p)}
                    className="text-[10px] font-bold px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-[#0ea5a0] hover:text-[#0ea5a0]"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {form.social_links.length === 0 && (
                <p className="text-sm text-gray-400">Belum ada link sosmed</p>
              )}
              {form.social_links.map((s) => (
                <div key={s.id} className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-gray-500 w-20 shrink-0 capitalize">
                    {s.platform}
                  </span>
                  <input
                    value={s.url}
                    onChange={(e) => updateSocial(s.id, { url: e.target.value })}
                    className={`${inputCls} flex-1`}
                    placeholder="URL / nomor / email"
                  />
                  <button
                    type="button"
                    onClick={() => removeSocial(s.id)}
                    className="text-red-400 hover:text-red-600 p-2"
                    title="Hapus"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-2">Tab Halaman</h2>
            <p className="text-xs text-gray-500 mb-3">
              Dikelola bersama halaman toko dan navigasi di bagian Konten.
            </p>
            <div className="flex flex-wrap gap-2">
              {navItems
                .filter((n) => n.is_visible !== false)
                .map((n) => (
                  <span
                    key={n.id}
                    className="px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold"
                  >
                    {n.label}
                  </span>
                ))}
              {!navItems.length && (
                <span className="text-sm text-gray-400">Belum ada navigasi</span>
              )}
            </div>
            <a
              href="/admin/halaman"
              className="inline-block mt-3 text-sm font-semibold text-[#0ea5a0] hover:underline"
            >
              Kelola halaman & menu →
            </a>
          </section>
        </div>

        <div className="xl:sticky xl:top-16 self-start">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Page Preview
          </p>
          <div className="mx-auto w-[290px]">
            <div className="relative rounded-[2.2rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-2xl z-20" />
              <div
                className="h-[540px] overflow-y-auto"
                style={{ fontFamily: themeFonts[form.theme_font] || themeFonts.system, ...(form.bg_image_url ? { backgroundColor: form.bg_color, backgroundImage: `${form.bg_style === 'flat' ? 'linear-gradient(rgba(255,255,255,.16), rgba(255,255,255,.16))' : `linear-gradient(180deg, ${form.bg_color}bb 0%, ${form.bg_color}66 40%, #f0fdfa99 75%)`}, url("${form.bg_image_url}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : form.bg_style === 'flat' ? { backgroundColor: form.bg_color } : { backgroundImage: `linear-gradient(180deg, ${form.bg_color} 0%, ${form.bg_color}cc 40%, #f0fdfa 75%)` }) }}
              >
                <div className="pt-8 pb-4 px-4 text-center text-white">
                  <div className="w-14 h-14 mx-auto rounded-full bg-white/20 border-2 border-white/40 overflow-hidden mb-2">
                    {form.profile_avatar_url ? (
                      <img
                        src={form.profile_avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-extrabold">
                        {(form.profile_name || 'BGY').slice(0, 3).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-extrabold">{form.profile_name}</p>
                  <p className="text-[10px] text-white/80">{form.profile_handle}</p>
                  {form.profile_about && (
                    <p className="text-[10px] text-white/85 mt-1.5 leading-relaxed line-clamp-3">
                      {form.profile_about}
                    </p>
                  )}
                  <div className="flex justify-center gap-1.5 mt-2 flex-wrap">
                    {form.social_links
                      .filter((s) => s.url)
                      .map((s) => (
                        <span
                          key={s.id}
                          className="text-[9px] font-bold bg-white/15 px-2 py-0.5 rounded-full capitalize"
                        >
                          {s.platform.slice(0, 2)}
                        </span>
                      ))}
                  </div>
                </div>

                {form.banner_enabled && form.banner_url && (
                  <div className="px-3 mb-2">
                    <img
                      src={form.banner_url}
                      alt=""
                      className="w-full rounded-xl border border-white/20"
                    />
                  </div>
                )}

                <div className="px-3 flex gap-1.5 overflow-x-auto pb-2">
                  {navItems
                    .filter((n) => n.is_visible !== false)
                    .map((n, i) => (
                      <span
                        key={n.id}
                        className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          i === 0 ? 'bg-white text-teal-700' : 'bg-white/20 text-white'
                        }`}
                      >
                        {n.label}
                      </span>
                    ))}
                </div>

                <div className="px-3 pb-6 space-y-2">
                  {previewProducts.map((p) => (
                    <div key={p.id} className="bg-white rounded-2xl p-3 shadow-sm">
                      <p className="text-[11px] font-bold text-gray-900 line-clamp-2">{p.title}</p>
                      <p className="text-[10px] font-extrabold text-[#0ea5a0] mt-1">
                        {p.type === 'free' ? 'GRATIS' : `Rp${(p.sale_price || 0).toLocaleString('id-ID')}`}
                      </p>
                    </div>
                  ))}
                  {!previewProducts.length && (
                    <div className="bg-white/90 rounded-2xl p-4 text-center text-xs text-gray-400">
                      Tidak ada produk
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

function ColorField({ value, onChange }) {
  return <div className="flex gap-2"><input aria-label="Pilih warna" type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 rounded border border-gray-200" /><input aria-label="Kode warna" value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} font-mono`} /></div>
}

function ImageUpload({ label, value, uploading, onChange, onRemove }) {
  return <Field label={label}>
    <div className="flex flex-wrap items-center gap-3">
      {value ? <img src={value} alt={`Pratinjau ${label}`} className="h-16 w-24 rounded-lg border border-gray-200 object-cover" /> : <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">Belum ada foto</div>}
      <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">{uploading ? 'Mengunggah...' : value ? 'Ganti foto' : 'Upload foto'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={onChange} className="sr-only" /></label>
      {value && <button type="button" onClick={onRemove} className="min-h-10 px-2 text-sm font-medium text-red-600">Hapus</button>}
      <span className="text-xs text-gray-500">JPG, PNG, WebP · maks. 5 MB</span>
    </div>
  </Field>
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
