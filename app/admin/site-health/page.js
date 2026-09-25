import { createClient } from '@/lib/supabase-server'

function StatusRow({ label, ok, detail }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {detail && <p className="text-xs text-gray-400 mt-0.5">{detail}</p>}
      </div>
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
        {ok ? 'OK' : 'Bermasalah'}
      </span>
    </div>
  )
}

async function checkSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
    return { ok: false, detail: 'NEXT_PUBLIC_SUPABASE_URL belum diatur' }
  }
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('settings').select('key', { count: 'exact', head: true })
    return error ? { ok: false, detail: error.message } : { ok: true, detail: supabaseUrl }
  } catch (e) {
    return { ok: false, detail: e.message }
  }
}

function checkEnv(name) {
  const value = process.env[name]
  const ok = !!value && !value.startsWith('your_')
  return { ok, detail: ok ? 'Terkonfigurasi' : `${name} belum diatur` }
}

async function getCounts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') return null
  try {
    const supabase = await createClient()
    const [{ count: products }, { count: orders }, { count: media }] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('media').select('id', { count: 'exact', head: true }),
    ])
    return { products: products || 0, orders: orders || 0, media: media || 0 }
  } catch {
    return null
  }
}

export default async function AdminSiteHealth() {
  const [supabaseCheck, mayarKey, mayarSecret, siteUrl, adminEmails, counts] = await Promise.all([
    checkSupabase(),
    Promise.resolve(checkEnv('MAYAR_API_KEY')),
    Promise.resolve(checkEnv('MAYAR_WEBHOOK_SECRET')),
    Promise.resolve(checkEnv('NEXT_PUBLIC_SITE_URL')),
    Promise.resolve(checkEnv('BGY_ADMIN_EMAILS')),
    getCounts(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Site Health</h1>
        <p className="text-sm text-gray-500 mt-0.5">Status koneksi dan konfigurasi sistem</p>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <StatusRow label="Koneksi Database (Supabase)" ok={supabaseCheck.ok} detail={supabaseCheck.detail} />
        <StatusRow label="Mayar API Key" ok={mayarKey.ok} detail={mayarKey.detail} />
        <StatusRow label="Mayar Webhook Secret" ok={mayarSecret.ok} detail={mayarSecret.detail} />
        <StatusRow label="Site URL" ok={siteUrl.ok} detail={siteUrl.detail} />
        <StatusRow label="Admin Emails" ok={adminEmails.ok} detail={adminEmails.detail} />
      </div>

      {counts && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase">Produk Aktif</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{counts.products}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase">Total Pesanan</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{counts.orders}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase">File Media</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{counts.media}</p>
          </div>
        </div>
      )}
    </div>
  )
}
