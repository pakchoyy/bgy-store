import Link from 'next/link'
import { Books, Tools, Folders, Bulb, ArrowRight } from 'tabler-icons-react'

const pillars = [
  {
    icon: Books,
    title: 'Bahan Pembelajaran',
    text: 'Modul ajar, ATP, media pembelajaran, LKPD, soal, dan berbagai materi pendukung.',
  },
  {
    icon: Tools,
    title: 'Tools Guru',
    text: 'Berbagai alat bantu digital untuk membantu pekerjaan guru menjadi lebih cepat dan praktis.',
  },
  {
    icon: Folders,
    title: 'Administrasi & Kebutuhan Kelas',
    text: 'File dan aplikasi pendukung untuk membantu pengelolaan kelas serta pekerjaan sekolah.',
  },
]

const audiences = ['Guru', 'Wali kelas', 'Operator sekolah', 'Pendidik']

function PrimaryCta({ className = '' }) {
  return (
    <Link
      href="/produk"
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-[background-color,transform] duration-150 hover:bg-emerald-800 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${className}`}
    >
      Jelajahi Produk
      <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />
    </Link>
  )
}

export default function AboutPage() {
  return (
    <div className="space-y-3">
      <section aria-labelledby="about-title" className="rounded-2xl bg-white/95 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0d7a8a]">Tentang Bantu Guru Yuk</p>
        <h1 id="about-title" className="mt-2 text-[1.6rem] font-bold leading-tight text-slate-900">
          Teman Praktis untuk Guru dan Pendidik
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
          Bantu Guru Yuk hadir untuk membantu guru menyelesaikan berbagai kebutuhan pembelajaran dan administrasi dengan cara yang lebih praktis, sederhana, dan siap digunakan.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <PrimaryCta />
          <Link href="/free" className="rounded text-sm font-semibold text-[#0d7a8a] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            Lihat materi gratis
          </Link>
        </div>
      </section>

      <section aria-labelledby="about-pillars" className="rounded-2xl bg-white/95 p-5 shadow-sm">
        <h2 id="about-pillars" className="text-lg font-semibold text-slate-900">Apa yang Tersedia?</h2>
        <ul className="mt-4 space-y-3">
          {pillars.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="about-story" className="rounded-2xl bg-[#123b35] p-5 text-white shadow-sm">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
          <Bulb size={22} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h2 id="about-story" className="mt-3 text-lg font-semibold leading-snug">Dibuat dari Masalah Nyata di Sekolah</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/85">
          Bantu Guru Yuk dikembangkan berdasarkan kebutuhan yang benar-benar ditemui dalam aktivitas guru sehari-hari. Tujuannya sederhana: mengurangi pekerjaan yang bisa dibuat lebih praktis, supaya guru bisa lebih fokus pada pembelajaran.
        </p>
      </section>

      <section aria-labelledby="about-audience" className="rounded-2xl bg-white/95 p-5 shadow-sm">
        <h2 id="about-audience" className="text-lg font-semibold text-slate-900">Untuk Siapa?</h2>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Pengguna Bantu Guru Yuk">
          {audiences.map((item) => (
            <li key={item} className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Guru, wali kelas, operator sekolah, dan pendidik yang membutuhkan materi siap pakai, alat bantu digital, maupun solusi sederhana yang tetap mudah disesuaikan dengan kebutuhan masing-masing.
        </p>
      </section>

      <section aria-labelledby="about-cta" className="rounded-2xl bg-white/95 p-5 text-center shadow-sm">
        <h2 id="about-cta" className="text-base font-semibold leading-snug text-slate-900">
          Temukan alat dan materi yang bisa membantu pekerjaan Anda.
        </h2>
        <PrimaryCta className="mt-4 w-full" />
      </section>
    </div>
  )
}
