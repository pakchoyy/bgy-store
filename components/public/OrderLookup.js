'use client'

import { useState } from 'react'

const input = 'mt-1 block h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'

export default function OrderLookup({ waUrl }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState(null)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget))
      const response = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Pesanan belum bisa dicek.')
      setOrders(data.orders || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <section aria-labelledby="lookup-title" className="rounded-2xl bg-white/95 p-5 shadow-sm">
        <h1 id="lookup-title" className="text-xl font-bold text-slate-900">Cek Pesanan & Download Ulang</h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Masukkan email dan nomor WhatsApp yang dipakai saat membeli. Semua pembelian kamu akan muncul di bawah.
        </p>
        <form onSubmit={submit} aria-busy={busy} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input name="email" type="email" required autoComplete="email" placeholder="nama@email.com" className={input} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Nomor WhatsApp
            <input name="whatsapp" type="tel" required inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" className={input} />
          </label>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
          <button disabled={busy} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-600 disabled:opacity-60">
            {busy ? 'Mencari...' : 'Cek Pesanan'}
          </button>
        </form>
      </section>

      {orders && (
        <section aria-live="polite" className="rounded-2xl bg-white/95 p-5 shadow-sm">
          {orders.length === 0 ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">Pesanan tidak ditemukan</p>
              <p className="mt-1 text-sm text-slate-600">Pastikan email dan nomor WhatsApp sama persis dengan saat membeli, dan pembayaran sudah berhasil.</p>
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-300 px-4 text-sm font-bold text-emerald-700 hover:bg-emerald-50">
                  Tanya admin via WhatsApp
                </a>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold text-slate-900">{orders.length} pembelian ditemukan</h2>
              <ul className="mt-3 space-y-2">
                {orders.map((order) => (
                  <li key={order.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">{order.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })} · Rp{Number(order.amount || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <a href={order.link} className="shrink-0 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600">Download</a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">Link download berlaku 7 hari dan bisa diperbarui kapan saja lewat halaman ini.</p>
            </>
          )}
        </section>
      )}
    </div>
  )
}
