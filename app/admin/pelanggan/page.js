import { fetchAll } from '@/lib/fetch-all'
import { assertAdminAction } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { formatRupiah } from '@/lib/utils'
import AdminToast from '@/components/admin/AdminToast'

export const dynamic = 'force-dynamic'

function waPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

const DEFAULT_MESSAGE = `Halo Bapak/Ibu Guru Hebat! 👋

Terima kasih sudah beli aplikasi kami.😊

Untuk info aplikasi terbaru, bantuan, kendala, atau memberikan masukan, silakan bergabung ke grup pengguna BGY:
👉 https://bit.ly/4bQZUW5

Terima kasih! 🙏`

async function saveMessage(formData) {
  'use server'
  await assertAdminAction()
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/pelanggan?toast=demo')
  const supabase = await createClient()
  const value = String(formData.get('message') || '').trim().slice(0, 2000)
  const { error } = await supabase.from('settings').upsert({ key: 'wa_customer_message', value }, { onConflict: 'key' })
  redirect(`/admin/pelanggan?toast=${error ? 'error' : 'success'}`)
}

async function getCustomers(supabase) {
  const [{ data: orders }, { data: items }] = await Promise.all([
    fetchAll(() => supabase
      .from('orders')
      .select('id, buyer_name, buyer_whatsapp, buyer_email, product_id, amount, created_at, product:products(title)')
      .eq('status', 'paid')
      .not('product_id', 'is', null)
      .order('created_at', { ascending: false })
      .order('id')),
    fetchAll(() => supabase.from('order_items').select('order_id, title, orders!inner(status)').eq('orders.status', 'paid').order('id')),
  ])
  const itemsByOrder = {}
  for (const row of items || []) (itemsByOrder[row.order_id] ||= []).push(row.title)

  // satu baris per pembeli (dikelompokkan dari nomor WA, kalau kosong pakai email)
  const map = new Map()
  for (const o of orders || []) {
    const phone = waPhone(o.buyer_whatsapp)
    const key = phone || String(o.buyer_email || '').toLowerCase() || o.id
    const c = map.get(key) || { key, name: o.buyer_name || 'Tanpa nama', phone, email: o.buyer_email || '', total: 0, count: 0, products: [], last: o.created_at }
    c.total += Number(o.amount || 0)
    c.count += 1
    for (const t of itemsByOrder[o.id] || [o.product?.title || 'Produk']) if (!c.products.includes(t)) c.products.push(t)
    map.set(key, c)
  }
  return [...map.values()]
}

export default async function AdminPelanggan({ searchParams }) {
  const toast = searchParams?.toast
  const q = String(searchParams?.q || '').toLowerCase()
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL
  let customers = []
  let message = DEFAULT_MESSAGE
  if (!isDemo) {
    const supabase = await createClient()
    const [list, { data: msgRow }] = await Promise.all([
      getCustomers(supabase),
      supabase.from('settings').select('value').eq('key', 'wa_customer_message').maybeSingle(),
    ])
    customers = list
    if (msgRow?.value) message = msgRow.value
  }
  const shown = q
    ? customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q.replace(/\D/g, '') || '~') || c.email.toLowerCase().includes(q))
    : customers

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <AdminToast toast={toast} message={toast === 'success' ? 'Pesan WA disimpan' : undefined} />
      <div>
        <h1 className="text-lg font-extrabold text-slate-900">Pelanggan</h1>
        <p className="text-sm text-slate-500">{customers.length} pembeli yang sudah bayar. Ketuk WA untuk mengirim pesan sapaan.</p>
      </div>

      <details className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <summary className="cursor-pointer text-sm font-bold text-slate-800">Atur isi pesan WA</summary>
        <form action={saveMessage} className="mt-3 space-y-3">
          <textarea name="message" rows={9} defaultValue={message} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900" />
          <button className="h-11 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800">Simpan pesan</button>
        </form>
      </details>

      <form method="GET" action="/admin/pelanggan">
        <input name="q" defaultValue={searchParams?.q || ''} placeholder="Cari nama, WA, atau email..." className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900" />
      </form>

      <ul className="space-y-2">
        {shown.map((c) => (
          <li key={c.key} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-slate-900">{c.name}</p>
              <p className="truncate text-xs text-slate-500">{c.products.join(', ')}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {c.count}× beli · {formatRupiah(c.total)} · terakhir {new Date(c.last).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })}
              </p>
            </div>
            {c.phone ? (
              <a
                href={`https://wa.me/${c.phone}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition-transform hover:bg-emerald-800 active:scale-[0.97]"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5 5.4 16A8 8 0 1 1 8 18.6L4 19.5Z" /></svg>
                WA
              </a>
            ) : (
              <span className="shrink-0 text-xs text-slate-400">Tanpa WA</span>
            )}
          </li>
        ))}
        {shown.length === 0 && <li className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">Belum ada pelanggan.</li>}
      </ul>
    </div>
  )
}
