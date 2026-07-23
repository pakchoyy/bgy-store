'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseSocialLinks } from '@/lib/utils'

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
    social_links: parseSocialLinks(initialAppearance.socialLinks || []),
  }))
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

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
            disabled={saving}
            className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-bold px-5 py-2 rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.msg}
        </div>
      )}

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
            <Field label="URL Avatar">
              <input
                value={form.profile_avatar_url}
                onChange={(e) => update('profile_avatar_url', e.target.value)}
                className={inputCls}
                placeholder="https://..."
              />
            </Field>
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
            <Field label="URL Banner (1200×628 disarankan)">
              <input
                value={form.banner_url}
                onChange={(e) => update('banner_url', e.target.value)}
                className={inputCls}
                placeholder="https://..."
              />
            </Field>
            {form.banner_url && (
              <img
                src={form.banner_url}
                alt="Banner preview"
                className="w-full max-h-40 object-cover rounded-xl border border-gray-100"
              />
            )}
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
              Dikelola di menu Navigation. Tab ini tampil di atas konten produk.
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
              href="/admin/navigation"
              className="inline-block mt-3 text-sm font-semibold text-[#0ea5a0] hover:underline"
            >
              Kelola Navigation →
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
                style={
                  form.bg_style === 'flat'
                    ? { backgroundColor: form.bg_color }
                    : {
                        backgroundImage: `linear-gradient(180deg, ${form.bg_color} 0%, ${form.bg_color}cc 40%, #f0fdfa 75%)`,
                      }
                }
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

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
