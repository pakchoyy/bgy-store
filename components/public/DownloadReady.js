'use client'

import { useState } from 'react'

export default function DownloadReady({ token, freeProductId, title }) {
  const [state, setState] = useState('ready')
  const [error, setError] = useState('')

  async function start() {
    setState('downloading')
    setError('')
    try {
      let url
      if (token) {
        url = `/api/download?token=${encodeURIComponent(token)}`
      } else {
        const response = await fetch('/api/download/free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: freeProductId }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data.url) throw new Error(data.error || 'File belum dapat diunduh.')
        url = data.url
      }
      window.location.assign(url)
      setTimeout(() => setState('done'), 1200)
    } catch (e) {
      setState('ready')
      setError(e.message || 'File belum dapat diunduh. Coba lagi.')
    }
  }

  const done = state === 'done'

  return (
    <div className={`mt-4 rounded-2xl border p-4 text-left ${done ? 'border-emerald-200 bg-emerald-50' : 'border-teal-200 bg-teal-50/60'}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${done ? 'bg-emerald-500' : 'bg-[#0ea5a0]'}`} aria-hidden="true">
          {done ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          )}
        </span>
        <div className="min-w-0 flex-1" role="status">
          <p className="text-sm font-bold text-gray-900">
            {done ? 'Download berhasil! 🎉' : state === 'downloading' ? 'Menyiapkan file...' : 'File siap diunduh'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
            {done
              ? <>Cek notifikasi browser atau folder <strong>Download</strong> di HP kamu.</>
              : title ? <>{title}</> : 'Tekan tombol di bawah untuk mengunduh.'}
          </p>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
      {done ? (
        <button type="button" onClick={start} className="mt-3 text-xs font-semibold text-gray-500 underline hover:text-gray-700">
          File belum masuk? Download ulang
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={state === 'downloading'}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-[background-color,transform] duration-150 hover:bg-emerald-600 active:scale-[0.97] disabled:opacity-70"
        >
          {state === 'downloading' ? 'Mengunduh...' : 'Download Sekarang'}
        </button>
      )}
    </div>
  )
}
