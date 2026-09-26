'use client'

import { useState } from 'react'

export default function ReferralShare({ code, percent, text }) {
  const [copied, setCopied] = useState(false)
  const link = typeof window === 'undefined' ? '' : `${window.location.origin}/?v=${code}`
  const message = `${text || `Aku pakai Bantu Guru Yuk buat bahan ajar & tools guru, praktis banget!`} Pakai kodeku *${code}* biar dapat diskon ${percent}%: ${link || `/?v=${code}`}`

  return (
    <section aria-labelledby="referral-title" className="rounded-2xl bg-white/95 p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">🤝 Ajak teman guru</p>
      <h2 id="referral-title" className="mt-1 text-base font-semibold text-gray-900">Temanmu dapat diskon {percent}% dengan kodemu</h2>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-base font-black tracking-widest text-emerald-800 ring-1 ring-emerald-200">{code}</code>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(link).then(() => setCopied(true)).catch(() => {})}
          className="rounded-xl border border-emerald-300 px-3 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
        >
          {copied ? 'Tersalin ✓' : 'Salin link'}
        </button>
      </div>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
      >
        Bagikan ke grup WhatsApp
      </a>
      <p className="mt-2 text-xs text-gray-500">Setiap kali kodemu dipakai, admin mencatatnya. Bagikan ke grup guru di sekolahmu!</p>
    </section>
  )
}
