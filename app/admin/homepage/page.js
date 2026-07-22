import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { demoSections } from '@/lib/demo-data'

async function saveSection(formData) {
  'use server'
  const raw = Object.fromEntries(formData)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    redirect('/admin/homepage?toast=demo')
  }
  const payload = {
    label: raw.label,
    is_visible: raw.is_visible === 'true',
    sort_order: parseInt(raw.sort_order) || 1,
    config: {},
  }
  const configFields = ['title', 'subtitle', 'cta_text', 'cta_url', 'text', 'content']
  for (const key of configFields) {
    if (raw[`config_${key}`] !== undefined) {
      payload.config[key] = raw[`config_${key}`]
    }
  }
  const { error } = await supabase
    .from('homepage_sections')
    .upsert({ id: raw.id, ...payload }, { onConflict: 'id' })
  if (error) redirect('/admin/homepage?toast=error')
  redirect('/admin/homepage?toast=success')
}

function DemoBadge() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800 flex items-center gap-2 mb-6">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span>Mode Demo — Data tidak disimpan</span>
    </div>
  )
}

function ToastBar({ toast }) {
  if (!toast) return null
  const isSuccess = toast === 'success'
  const isDemo = toast === 'demo'
  const bg = isDemo ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
  const msg = isDemo ? 'Mode Demo — Data tidak disimpan' : isSuccess ? 'Bagian berhasil disimpan!' : 'Gagal menyimpan bagian'
  return (
    <div className={`${bg} border rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isSuccess ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      <span>{msg}</span>
    </div>
  )
}

function HeroForm({ section }) {
  const c = section.config || {}
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
        <input name="config_title" defaultValue={c.title || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Subtitle</label>
        <input name="config_subtitle" defaultValue={c.subtitle || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">CTA Text</label>
        <input name="config_cta_text" defaultValue={c.cta_text || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">CTA URL</label>
        <input name="config_cta_url" defaultValue={c.cta_url || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
      </div>
    </div>
  )
}

function PromoForm({ section }) {
  const c = section.config || {}
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Teks Banner</label>
        <input name="config_text" defaultValue={c.text || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">CTA Text</label>
        <input name="config_cta_text" defaultValue={c.cta_text || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">CTA URL</label>
        <input name="config_cta_url" defaultValue={c.cta_url || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
      </div>
    </div>
  )
}

function AboutForm({ section }) {
  const c = section.config || {}
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
        <input name="config_title" defaultValue={c.title || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Konten</label>
        <textarea name="config_content" rows={4} defaultValue={c.content || ''} className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 w-full text-sm resize-y" />
      </div>
    </div>
  )
}

function AutoInfo() {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-500 italic">
      Otomatis dari database
    </div>
  )
}

function SectionCard({ section, index }) {
  const formId = `section-form-${section.id}`
  return (
    <form action={saveSection} id={formId} className="bg-white rounded-xl shadow-card p-6">
      <input type="hidden" name="id" value={section.id} />
      <input type="hidden" name="key" value={section.key} />
      <input type="hidden" name="sort_order" value={section.sort_order} />
      <details className="group">
        <summary className="list-none cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="text-gray-300 hover:text-gray-500 cursor-grab shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-md px-2 py-0.5">{String(section.sort_order).padStart(2, '0')}</span>
                <span className="text-sm font-semibold text-gray-900">{section.label}</span>
              </div>
              <span className="text-xs text-gray-400">{section.key}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="hidden" name="is_visible" value="false" />
              <input type="checkbox" name="is_visible" value="true" defaultChecked={section.is_visible} onChange={e => {
                const form = e.target.closest('form')
                const hidden = form.querySelector('input[type=hidden][name=is_visible]')
                hidden.disabled = e.target.checked
              }} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0ea5a0]" />
            </label>
            <svg className="w-4 h-4 text-gray-300 group-open:rotate-180 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </summary>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <input type="hidden" name="label" value={section.label} />
          {section.key === 'hero' && <HeroForm section={section} />}
          {section.key === 'promo_banner' && <PromoForm section={section} />}
          {section.key === 'about' && <AboutForm section={section} />}
          {['featured_products', 'categories', 'free_products'].includes(section.key) && <AutoInfo />}
          <div className="mt-4 flex justify-end">
            <button type="submit" className="bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Simpan
            </button>
          </div>
        </div>
      </details>
    </form>
  )
}

export default async function AdminHomepage({ searchParams }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const toast = searchParams?.toast
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL
  let sections = []
  if (!isDemo) {
    const { data } = await supabase.from('homepage_sections').select('*').order('sort_order', { ascending: true })
    if (data) sections = data
  }
  if (sections.length === 0) sections = demoSections
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-gray-900">Homepage Section Manager</h1>
      </div>
      {isDemo && <DemoBadge />}
      <ToastBar toast={toast} />
      <div className="space-y-4">
        {sections.map((section, i) => (
          <SectionCard key={section.id} section={section} index={i} />
        ))}
      </div>
    </div>
  )
}
