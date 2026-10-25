import { assertAdminAction } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { formatRupiah } from '@/lib/utils'
import AdminToast from '@/components/admin/AdminToast'
import AdminTabs, { VOUCHER_TABS } from '@/components/admin/AdminTabs'

async function createVoucher(formData) {
  'use server'
  await assertAdminAction()
  const supabase = await createClient()
  const code = String(formData.get('code') || '').trim().toUpperCase()
  const name = String(formData.get('name') || '').trim()
  const discountType = String(formData.get('discount_type') || 'percent')
  const discountValue = Number(formData.get('discount_value') || 0)
  const maxUses = formData.get('max_uses') ? Number(formData.get('max_uses')) : null
  const minOrderAmount = formData.get('min_order_amount') ? Number(formData.get('min_order_amount')) : 0
  const rawEndsAt = String(formData.get('ends_at') || '')
  const endsAt = rawEndsAt ? new Date(/[zZ]|[+-]\d\d:\d\d$/.test(rawEndsAt) ? rawEndsAt : `${rawEndsAt}:00+07:00`).toISOString() : null

  if (!code || !name || !discountValue) redirect('/admin/voucher?toast=error')
  // Kosong = berlaku untuk semua produk (kolom product_ids, SQL 025).
  const productIds = formData.getAll('product_ids').map(String).filter(Boolean)

  const { error } = await supabase.from('vouchers').insert({
    ...(productIds.length ? { product_ids: productIds } : {}),
    code,
    name,
    discount_type: discountType === 'fixed' ? 'fixed' : 'percent',
    discount_value: discountValue,
    max_uses: maxUses,
    min_order_amount: minOrderAmount,
    ends_at: endsAt,
    is_active: true,
  })

  redirect(`/admin/voucher?toast=${error ? 'error' : 'success'}`)
}

async function toggleVoucher(formData) {
  'use server'
  await assertAdminAction()
  const supabase = await createClient()
  const id = formData.get('id')
  const isActive = formData.get('is_active') === 'true'
  const { error } = await supabase.from('vouchers').update({ is_active: !isActive }).eq('id', id)
  redirect(`/admin/voucher?toast=${error ? 'error' : 'success'}`)
}

async function deleteVoucher(formData) {
  'use server'
  await assertAdminAction()
  const supabase = await createClient()
  const id = formData.get('id')
  const { error } = await supabase.from('vouchers').delete().eq('id', id)
  redirect(`/admin/voucher?toast=${error ? 'error' : 'success'}`)
}

async function saveKupon(formData) {
  'use server'
  await assertAdminAction()
  const supabase = await createClient()
  const rows = [
    { key: 'promo_after_download_code', value: String(formData.get('code') || '').trim().toUpperCase() },
    { key: 'promo_after_download_text', value: String(formData.get('text') || '').trim() },
  ]
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
  redirect(`/admin/voucher?tab=kupon&toast=${error ? 'error' : 'success'}`)
}

async function saveDownloadSettings(formData) {
  'use server'
  await assertAdminAction()
  const supabase = await createClient()
  const keys = ['pdf_watermark_enabled', 'referral_discount_percent', 'referral_share_text']
  // checkbox: hidden "false" lalu checkbox "true" -> ambil nilai terakhir
  const rows = keys.map((key) => ({ key, value: String(formData.getAll(key).pop() ?? '') }))
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
  redirect(`/admin/voucher?tab=kupon&toast=${error ? 'error' : 'success'}`)
}

function voucherKind(voucher, kuponCode) {
  if (kuponCode && voucher.code === kuponCode) return { label: '🎁 Kupon download', cls: 'bg-amber-100 text-amber-800' }
  if (String(voucher.name || '').startsWith('Referral:')) return { label: '🤝 Referral', cls: 'bg-sky-100 text-sky-800' }
  return { label: '🎟️ Voucher', cls: 'bg-emerald-100 text-emerald-800' }
}

function formatDiscount(voucher) {
  if (voucher.discount_type === 'fixed') return formatRupiah(voucher.discount_value)
  return `${voucher.discount_value}%`
}

export default async function AdminVoucher({ searchParams }) {
  const supabase = await createClient()
  const toast = searchParams?.toast
  const tab = searchParams?.tab === 'kupon' ? 'kupon' : 'voucher'
  const [{ data, error }, { data: promoRows }, { data: paidProducts }] = await Promise.all([
    supabase.from('vouchers').select('*').order('created_at', { ascending: false }),
    supabase.from('settings').select('key, value').in('key', ['promo_after_download_code', 'promo_after_download_text', 'pdf_watermark_enabled', 'referral_discount_percent', 'referral_share_text']),
    supabase.from('products').select('id, title').eq('type', 'paid').is('deleted_at', null).order('sort_order'),
  ])
  const productTitle = Object.fromEntries((paidProducts || []).map((p) => [p.id, p.title]))

  const vouchers = data || []
  const promo = Object.fromEntries((promoRows || []).map((row) => [row.key, row.value]))
  const kuponCode = promo.promo_after_download_code || ''
  const kuponVoucher = vouchers.find((voucher) => voucher.code === kuponCode)
  const kuponChoices = vouchers.filter((voucher) => voucher.is_active && !String(voucher.name || '').startsWith('Referral:'))

  if (tab === 'kupon') {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <AdminToast toast={toast} message={toast === 'success' ? 'Kupon berhasil disimpan' : undefined} />
        <AdminTabs tabs={VOUCHER_TABS} active="kupon" />

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h1 className="text-lg font-extrabold text-slate-700">Kupon Download Gratis</h1>
          <p className="mt-1 text-sm text-slate-500">
            Muncul otomatis setelah pengunjung download produk <b>gratis</b>, untuk mengajak mereka membeli produk premium.
            Bedanya dengan voucher biasa: voucher dibagikan manual oleh kamu, kupon ini ditampilkan otomatis oleh website.
          </p>

          <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${kuponCode && kuponVoucher?.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
            {!kuponCode
              ? 'Status: nonaktif — belum ada kupon yang dipilih.'
              : !kuponVoucher
                ? `Status: kode ${kuponCode} tidak ditemukan di daftar voucher. Pilih ulang di bawah.`
                : kuponVoucher.is_active
                  ? `Status: aktif — ${kuponCode} (diskon ${formatDiscount(kuponVoucher)}, sudah dipakai ${kuponVoucher.used_count || 0}×)`
                  : `Status: voucher ${kuponCode} sedang Off, kupon tidak berguna. Aktifkan di tab Voucher.`}
          </div>

          <form action={saveKupon} className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Pakai kode voucher</span>
              <select name="code" defaultValue={kuponVoucher ? kuponCode : ''} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#25bd83] focus:ring-2 focus:ring-emerald-100">
                <option value="">— Nonaktifkan kupon —</option>
                {kuponChoices.map((voucher) => (
                  <option key={voucher.id} value={voucher.code}>{voucher.code} · diskon {formatDiscount(voucher)} · {voucher.name}</option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-slate-500">Belum ada pilihan? Buat dulu kodenya di tab <a href="/admin/voucher" className="font-bold underline">Voucher</a>.</span>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Teks penawaran</span>
              <input name="text" defaultValue={promo.promo_after_download_text || ''} placeholder="Contoh: Diskon 20% untuk semua produk premium" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#25bd83] focus:ring-2 focus:ring-emerald-100" />
            </label>
            <button className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition-transform hover:bg-emerald-800 active:scale-[0.98]">
              Simpan Kupon
            </button>
          </form>
        </section>

        <form action={saveDownloadSettings} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-extrabold text-slate-700">Pengaturan Download & Referral</h2>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-bold text-gray-900">🔒 Watermark nama pembeli di PDF</span>
                  <span className="mt-1 block text-xs text-gray-600">File PDF produk berbayar otomatis diberi tulisan &ldquo;Lisensi pribadi: nama – email&rdquo; di setiap halaman saat diunduh. Berlaku untuk PDF yang di-upload (bukan link) dengan ukuran maksimal 4 MB; file lebih besar dikirim tanpa watermark.</span>
                </span>
                <input type="hidden" name="pdf_watermark_enabled" value="false" />
                <input type="checkbox" name="pdf_watermark_enabled" value="true" defaultChecked={promo.pdf_watermark_enabled === 'true'} className="mt-1 h-5 w-5 shrink-0 accent-emerald-600" />
              </label>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h2 className="text-sm font-bold text-gray-900">🤝 Referral pembeli</h2>
              <p className="mt-1 text-xs text-gray-600">Setiap pembeli produk berbayar otomatis dapat kode pribadi (contoh REFBUDI1A2B) di halaman Terima Kasih untuk dibagikan. Temannya dapat diskon. Lihat siapa yang paling sering mengajak di menu Voucher (&ldquo;Dipakai X×&rdquo;), lalu beri hadiah. Isi 0 untuk menonaktifkan.</p>
              <label className="mt-3 block text-sm font-medium text-gray-700">Diskon untuk teman (%)
                <input name="referral_discount_percent" type="number" min="0" max="90" defaultValue={promo.referral_discount_percent || ''} placeholder="Contoh: 10" className="mt-1 border border-gray-200 rounded-lg px-4 py-2.5 bg-white w-full text-sm" />
              </label>
              <label className="mt-3 block text-sm font-medium text-gray-700">Teks ajakan <span className="font-normal text-gray-400">(opsional)</span>
                <input name="referral_share_text" defaultValue={promo.referral_share_text || ''} placeholder="Contoh: Aku langganan bahan ajar di Kreacy, praktis!" className="mt-1 border border-gray-200 rounded-lg px-4 py-2.5 bg-white w-full text-sm" />
              </label>
            </div>
          <button className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition-transform hover:bg-emerald-800 active:scale-[0.98]">
            Simpan
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <AdminToast toast={toast} message={toast === 'success' ? 'Voucher berhasil diperbarui' : undefined} />
      <AdminTabs tabs={VOUCHER_TABS} active="voucher" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-700">Vouchers</h1>
          <p className="mt-1 text-sm text-slate-500">Atur kode diskon untuk checkout toko.</p>
        </div>
        <a href="/" target="_blank" className="rounded-xl border border-[#25bd83] bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">Share</a>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          Tabel voucher belum tersedia. Jalankan migration `006_vouchers.sql` di Supabase.
        </div>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-lg font-extrabold text-slate-700">Buat Voucher Baru</h2>
        <p className="mt-1 text-sm text-slate-500">Pembeli memasukkan kode voucher saat checkout produk berbayar.</p>
        <form action={createVoucher} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Nama promo</span>
            <input name="name" required placeholder="Contoh: Promo Hari Guru" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#25bd83] focus:ring-2 focus:ring-emerald-100" />
            <span className="mt-1 block text-xs text-slate-500">Hanya untuk catatan kamu, tidak tampil ke pembeli.</span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Kode voucher</span>
            <input name="code" required placeholder="Contoh: KREACYHEMAT" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#25bd83] focus:ring-2 focus:ring-emerald-100 font-bold uppercase" />
            <span className="mt-1 block text-xs text-slate-500">Yang diketik pembeli. Huruf besar, tanpa spasi.</span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Jenis diskon</span>
            <select name="discount_type" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#25bd83] focus:ring-2 focus:ring-emerald-100">
              <option value="percent">Persen (%)</option>
              <option value="fixed">Nominal (Rp)</option>
            </select>
            <span className="mt-1 block text-xs text-slate-500">Persen = potongan % dari harga. Nominal = potongan rupiah tetap.</span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Besar diskon</span>
            <input name="discount_value" required type="number" min="1" placeholder="Contoh: 20" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#25bd83] focus:ring-2 focus:ring-emerald-100" />
            <span className="mt-1 block text-xs text-slate-500">Isi 20 untuk 20% atau 5000 untuk Rp5.000. Isi 100 (persen) untuk gratis.</span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Batas pemakaian <span className="font-normal text-slate-400">(opsional)</span></span>
            <input name="max_uses" type="number" min="1" placeholder="Contoh: 50" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#25bd83] focus:ring-2 focus:ring-emerald-100" />
            <span className="mt-1 block text-xs text-slate-500">Berapa kali kode bisa dipakai total. Kosongkan = tanpa batas.</span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Minimal belanja <span className="font-normal text-slate-400">(opsional)</span></span>
            <input name="min_order_amount" type="number" min="0" placeholder="Contoh: 20000" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#25bd83] focus:ring-2 focus:ring-emerald-100" />
            <span className="mt-1 block text-xs text-slate-500">Voucher hanya berlaku kalau harga produk minimal segini (Rp).</span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Berlaku sampai <span className="font-normal text-slate-400">(opsional)</span></span>
            <input name="ends_at" type="datetime-local" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#25bd83] focus:ring-2 focus:ring-emerald-100" />
            <span className="mt-1 block text-xs text-slate-500">Setelah tanggal & jam ini voucher otomatis tidak berlaku. Kosongkan = selamanya.</span>
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-semibold text-slate-700">Hanya untuk produk <span className="font-normal text-slate-400">(opsional)</span></legend>
            <span className="mt-1 block text-xs text-slate-500">Tidak dicentang = berlaku untuk semua produk. Potongan hanya dihitung dari produk yang dicentang.</span>
            <div className="mt-2 grid max-h-56 gap-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-2">
              {(paidProducts || []).map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="product_ids" value={p.id} className="h-4 w-4 accent-emerald-600" />{p.title}</label>
              ))}
            </div>
          </fieldset>
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 sm:col-span-2">
            Catatan: total setelah diskon harus minimal <b>Rp1.000</b> (batas pembayaran online) atau tepat <b>Rp0</b> (gratis, file langsung didapat tanpa bayar).
          </p>
          <button className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition-transform hover:bg-emerald-800 active:scale-[0.98] sm:col-span-2">
            Buat Voucher
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-extrabold text-slate-700">Daftar Voucher</h2>
          <p className="mt-1 text-sm text-slate-500">Satu kode voucher bisa dipakai saat checkout sesuai batas yang kamu atur.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {vouchers.map((voucher) => {
            const remaining = voucher.max_uses ? Math.max(0, voucher.max_uses - (voucher.used_count || 0)) : null
            const kind = voucherKind(voucher, kuponCode)
            return (
              <div key={voucher.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.2a2.8 2.8 0 0 0 0 5.6V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.2a2.8 2.8 0 0 0 0-5.6V7Zm8-1v12" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold text-slate-800">
                    <span className="min-w-0 break-words">{voucher.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${kind.cls}`}>{kind.label}</span>
                  </p>
                  <p className="text-xs text-slate-400"><span className="font-bold text-emerald-700">{voucher.code}</span> - Diskon {formatDiscount(voucher)}{voucher.product_ids?.length ? ` · Khusus: ${voucher.product_ids.map((id) => productTitle[id] || 'produk terhapus').join(', ')}` : ''}</p>
                </div>
                <span className="text-sm text-slate-400">{`Dipakai ${voucher.used_count || 0}×`} · {remaining === null ? 'Tanpa batas' : `Sisa ${remaining}`}{voucher.ends_at ? ` · s/d ${new Date(voucher.ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })}` : ''}</span>
                <form action={toggleVoucher}>
                  <input type="hidden" name="id" value={voucher.id} />
                  <input type="hidden" name="is_active" value={String(voucher.is_active)} />
                  <button className={`rounded-xl px-3 py-1.5 text-xs font-bold ${voucher.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {voucher.is_active ? 'Aktif' : 'Off'}
                  </button>
                </form>
                <form action={deleteVoucher}>
                  <input type="hidden" name="id" value={voucher.id} />
                  <button className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50">Hapus</button>
                </form>
              </div>
            )
          })}
          {vouchers.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Belum ada voucher.</div>
          )}
        </div>
      </section>
    </div>
  )
}
