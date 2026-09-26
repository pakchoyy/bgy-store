import Link from 'next/link'
import { Download, CircleCheck, CircleX, CreditCard, Refresh, BrandWhatsapp, ShieldCheck } from 'tabler-icons-react'

const allowed = [
  'Dipakai untuk pembelajaran di kelas sendiri',
  'Diedit dan disesuaikan dengan kebutuhan sekolah',
  'Dicetak untuk keperluan administrasi',
]

const notAllowed = [
  'Dijual ulang dalam bentuk apa pun',
  'Dibagikan massal di grup atau media sosial',
  'Diakui sebagai karya sendiri',
]

function Card({ icon: Icon, id, title, children, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700',
  }
  return (
    <section aria-labelledby={id} className="rounded-2xl bg-white/95 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h2 id={id} className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  )
}

export default function TermsPage({ waUrl }) {
  return (
    <div className="space-y-3">
      <section aria-labelledby="terms-title" className="rounded-2xl bg-white/95 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0d7a8a]">Syarat & Ketentuan</p>
        <h1 id="terms-title" className="mt-2 text-[1.6rem] font-bold leading-tight text-slate-900">
          Aturan Singkat Belanja di Bantu Guru Yuk
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
          Kami buat sesingkat mungkin supaya mudah dipahami. Dengan membeli atau mengunduh produk, Anda menyetujui poin-poin di bawah ini.
        </p>
      </section>

      <Card icon={Download} id="terms-product" title="Produk Digital">
        <p>Semua produk berupa file digital. Setelah pembayaran berhasil, tombol download muncul otomatis di halaman Terima Kasih.</p>
        <p className="mt-2">Tautan download berlaku <strong className="text-slate-800">7 hari</strong>. Simpan file di perangkat Anda setelah diunduh.</p>
      </Card>

      <Card icon={ShieldCheck} id="terms-usage" title="Penggunaan File">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-emerald-50 p-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Boleh</p>
            <ul className="mt-2 space-y-1.5">
              {allowed.map((item) => (
                <li key={item} className="flex gap-2 text-emerald-900">
                  <CircleCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-red-50 p-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-red-800">Tidak boleh</p>
            <ul className="mt-2 space-y-1.5">
              {notAllowed.map((item) => (
                <li key={item} className="flex gap-2 text-red-900">
                  <CircleX size={18} className="mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card icon={CreditCard} id="terms-payment" title="Pembayaran" tone="sky">
        <p>Pembayaran diproses aman oleh <strong className="text-slate-800">Mayar</strong> dan bisa lewat QRIS, e-wallet, transfer bank, atau minimarket. Pastikan email dan nomor WhatsApp yang diisi benar agar file bisa kami kirim.</p>
      </Card>

      <Card icon={Refresh} id="terms-refund" title="Pengembalian Dana" tone="amber">
        <p>Karena produk bersifat digital, pembelian yang sudah berhasil tidak dapat dibatalkan atau dikembalikan dananya.</p>
        <p className="mt-2">Jika file rusak, tidak bisa dibuka, atau tidak sesuai deskripsi, hubungi kami. <strong className="text-slate-800">Kami bantu ganti filenya.</strong></p>
      </Card>

      <section aria-labelledby="terms-contact" className="rounded-2xl bg-[#123b35] p-5 text-center text-white shadow-sm">
        <h2 id="terms-contact" className="text-base font-semibold">Ada pertanyaan atau kendala?</h2>
        <p className="mt-1 text-sm text-white/80">Tim Bantu Guru Yuk siap membantu.</p>
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
          >
            <BrandWhatsapp size={20} aria-hidden="true" />
            Hubungi via WhatsApp
          </a>
        ) : (
          <Link href="/halaman/faq" className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-600">
            Lihat FAQ
          </Link>
        )}
        <Link href="/produk" className="mt-3 inline-block text-sm font-semibold text-emerald-200 underline-offset-4 hover:underline">
          Kembali belanja
        </Link>
      </section>
    </div>
  )
}
