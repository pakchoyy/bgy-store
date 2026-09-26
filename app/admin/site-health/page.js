import { createClient, createServiceClient, hasServiceRole } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const TONES = {
  ok: { box: 'bg-green-50 text-green-700', dot: 'bg-green-500', label: 'OK' },
  warn: { box: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', label: 'Opsional' },
  error: { box: 'bg-red-50 text-red-700', dot: 'bg-red-500', label: 'Perlu diatur' },
}

function StatusRow({ label, status, detail }) {
  const tone = TONES[status]
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {detail && <p className="mt-0.5 break-words text-xs text-gray-500">{detail}</p>}
      </div>
      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tone.box}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
        {tone.label}
      </span>
    </div>
  )
}

const ENV_CHECKS = [
  { name: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase service role key', required: true, why: 'Checkout, download, cek pembayaran otomatis' },
  { name: 'MAYAR_API_KEY', label: 'Mayar API key', required: true, why: 'Membuat tagihan dan mengecek status pembayaran' },
  { name: 'NEXT_PUBLIC_SITE_URL', label: 'Alamat website', required: true, why: 'Link di email, WhatsApp, dan gambar share' },
  { name: 'MAYAR_WEBHOOK_SECRET', label: 'Mayar webhook secret', required: false, why: 'Mempercepat konfirmasi; tanpa ini status tetap dicek lewat API' },
  { name: 'RESEND_API_KEY', label: 'Resend API key', required: false, why: 'Email link download ke pembeli' },
  { name: 'EMAIL_FROM', label: 'Alamat pengirim email', required: false, why: 'Contoh: Bantu Guru Yuk <noreply@domainmu.com>' },
  { name: 'ADMIN_NOTIFY_EMAIL', label: 'Email notifikasi admin', required: false, why: 'Kabar setiap ada pesanan lunas/traktir' },
]

const MIGRATIONS = [
  { sql: '011', label: 'Keamanan & SEO produk', table: 'products', column: 'meta_description' },
  { sql: '012', label: 'Tanda pesanan dibaca', table: 'orders', column: 'admin_read_at' },
  { sql: '013', label: 'Views & clicks', table: 'analytics_events', column: 'id' },
  { sql: '014', label: 'Instansi di review', table: 'product_reviews', column: 'reviewer_institution' },
  { sql: '015', label: 'Checkout keranjang', table: 'order_items', column: 'id' },
  { sql: '016', label: 'Bundle / paket', table: 'products', column: 'bundle_product_ids' },
  { sql: '017', label: 'Flash sale', table: 'products', column: 'flash_price' },
]

function envStatus({ name, required, why }) {
  const value = process.env[name]
  const ok = !!value && !value.startsWith('your_')
  return { status: ok ? 'ok' : required ? 'error' : 'warn', detail: ok ? why : `${name} belum diisi di Vercel — ${why}` }
}

async function checkDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') return { status: 'error', detail: 'NEXT_PUBLIC_SUPABASE_URL belum diatur' }
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('settings').select('key', { count: 'exact', head: true })
    return error ? { status: 'error', detail: error.message } : { status: 'ok', detail: supabaseUrl }
  } catch (e) {
    return { status: 'error', detail: e.message }
  }
}

async function checkMigrations() {
  if (!hasServiceRole()) return null
  const supabase = await createServiceClient()
  return Promise.all(MIGRATIONS.map(async (m) => {
    const { error } = await supabase.from(m.table).select(m.column, { head: true, count: 'exact' }).limit(1)
    return { ...m, done: !error }
  }))
}

async function getCounts() {
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
  const [database, migrations, counts] = await Promise.all([checkDatabase(), checkMigrations(), getCounts()])
  const pending = (migrations || []).filter((m) => !m.done)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Cek Sistem</h1>
        <p className="text-sm text-gray-500 mt-0.5">Apa yang sudah siap dan apa yang masih perlu diatur</p>
      </div>

      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-bold text-gray-900">Pengaturan Vercel</h2>
        <StatusRow label="Koneksi database (Supabase)" status={database.status} detail={database.detail} />
        {ENV_CHECKS.map((check) => {
          const { status, detail } = envStatus(check)
          return <StatusRow key={check.name} label={check.label} status={status} detail={detail} />
        })}
      </section>

      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-bold text-gray-900">SQL Supabase</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {migrations === null
              ? 'Isi SUPABASE_SERVICE_ROLE_KEY dulu supaya status SQL bisa dicek.'
              : pending.length
                ? `Belum dijalankan: SQL ${pending.map((m) => m.sql).join(', ')}. File ada di folder supabase/migrations.`
                : 'Semua SQL sudah dijalankan.'}
          </p>
        </div>
        {(migrations || []).map((m) => (
          <StatusRow key={m.sql} label={`SQL ${m.sql} — ${m.label}`} status={m.done ? 'ok' : 'error'} detail={m.done ? null : 'Jalankan di Supabase → SQL Editor'} />
        ))}
      </section>

      {counts && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase">Produk</p>
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
