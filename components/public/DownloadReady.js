'use client'

import { useEffect, useState } from 'react'

function readDone(key) {
  try {
    return key ? localStorage.getItem(key) === '1' : false
  } catch {
    return false
  }
}

function saveDone(key) {
  try {
    if (key) localStorage.setItem(key, '1')
  } catch {}
}

export default function DownloadReady({ token, itemId, freeProductId, title, isLink = false, isActivation = false, fileName = null, storageKey, compact = false }) {
  const [state, setState] = useState('ready')
  const [error, setError] = useState('')
  const [toast, setToast] = useState(false)
  const [confirmAgain, setConfirmAgain] = useState(false)

  useEffect(() => {
    if (readDone(storageKey)) setState('done')
  }, [storageKey])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(false), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  async function start() {
    setConfirmAgain(false)
    setState('downloading')
    setError('')
    const linkWindow = isLink ? window.open('', '_blank') : null
    try {
      let url
      if (token) {
        url = `/api/download?token=${encodeURIComponent(token)}${itemId ? `&item=${encodeURIComponent(itemId)}` : ''}`
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
      saveDone(storageKey)
      if (linkWindow) linkWindow.location.href = url
      else window.location.assign(url)
      setTimeout(() => {
        setState('done')
        setToast(true)
      }, 1200)
    } catch (e) {
      linkWindow?.close()
      setState('ready')
      setError(e.message || 'File belum dapat diunduh. Coba lagi.')
    }
  }

  const done = state === 'done'
  const noun = isLink ? 'link' : 'file'
  // Produk lisensi: pembeli mengambil kode aktivasi, bukan mengunduh file.
  const text = isActivation
    ? {
        ready: 'Kode aktivasi siap diambil',
        busy: 'Membuka halaman aktivasi...',
        done: 'Halaman aktivasi sudah dibuka ✓',
        doneBody: 'Halaman aktivasi terbuka di tab baru. Ikuti langkahnya di halaman itu. Kalau tertutup, buka lagi dari sini.',
        button: 'Ambil Kode Aktivasi',
        confirm: 'Buka halaman aktivasi lagi?',
        yes: 'Ya, buka lagi',
        again: 'Halaman tertutup? Buka lagi',
        toastTitle: 'Halaman aktivasi dibuka di tab baru',
        toastBody: 'Cek tab browser kamu.',
      }
    : isLink
      ? {
          ready: 'Link produk siap dibuka',
          busy: `Menyiapkan ${noun}...`,
          done: 'Link sudah dibuka ✓',
          doneBody: 'Link produk terbuka di tab baru. Simpan atau bookmark link tersebut supaya mudah dibuka lagi.',
          button: 'Buka Link Produk',
          confirm: 'Buka link produk lagi?',
          yes: 'Ya, buka lagi',
          again: 'Buka link lagi',
          toastTitle: 'Link dibuka di tab baru',
          toastBody: 'Cek tab browser kamu.',
        }
      : {
          ready: 'File siap diunduh',
          busy: `Menyiapkan ${noun}...`,
          done: 'File sudah diunduh ✓',
          doneBody: null,
          button: 'Download Sekarang',
          confirm: 'File mungkin sudah ada di HP kamu. Tetap download lagi?',
          yes: 'Ya, download lagi',
          again: 'File tidak ketemu? Download ulang',
          toastTitle: 'Download dimulai',
          toastBody: 'Cek notifikasi atau folder Download.',
        }

  return (
    <>
      <div className={`${compact ? 'mt-3' : 'mt-4'} rounded-2xl border p-4 text-left ${done ? 'border-emerald-200 bg-emerald-50' : 'border-teal-200 bg-teal-50/60'}`}>
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${done ? 'bg-emerald-700' : 'bg-[#0ea5a0]'}`} aria-hidden="true">
            {done ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            ) : isActivation ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 7a4 4 0 11-3.6 5.7L4 20v-3h3v-2h2l1.7-1.7A4 4 0 0115 7zm1 1h.01" /></svg>
            ) : isLink ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10 14a5 5 0 007.1 0l3-3a5 5 0 00-7.1-7.1l-1.2 1.2M14 10a5 5 0 00-7.1 0l-3 3a5 5 0 007.1 7.1l1.2-1.2" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            )}
          </span>
          <div className="min-w-0 flex-1" role="status">
            <p className="text-sm font-bold text-gray-900">
              {done ? text.done : state === 'downloading' ? text.busy : text.ready}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{title}</p>
            {fileName && <p className="mt-1 break-all text-xs font-semibold text-gray-700">📄 {fileName}</p>}
          </div>
        </div>

        {done ? (
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-emerald-900">
            {isLink ? (
              <p>{text.doneBody}</p>
            ) : (
              <>
                <p><strong>Tidak perlu download lagi.</strong> Cari file di:</p>
                <ul className="list-disc space-y-0.5 pl-5">
                  <li>Notifikasi HP (tarik layar dari atas), atau</li>
                  <li>Aplikasi <strong>File Saya / File Manager → Download</strong>, atau</li>
                  <li>Chrome: ketuk <strong>⋮ → Download</strong></li>
                </ul>
              </>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={state === 'downloading'}
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-[background-color,transform] duration-150 hover:bg-emerald-800 active:scale-[0.97] disabled:opacity-70"
          >
            {state === 'downloading' ? 'Memproses...' : text.button}
          </button>
        )}

        {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}

        {done && (
          confirmAgain ? (
            <div className="mt-3 rounded-xl bg-white p-3 text-xs text-gray-700 ring-1 ring-gray-200">
              <p>{text.confirm}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={start} className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 font-bold text-white">{text.yes}</button>
                <button type="button" onClick={() => setConfirmAgain(false)} className="flex-1 rounded-lg bg-gray-100 px-3 py-2 font-semibold text-gray-700">Batal</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmAgain(true)} className="mt-3 text-xs font-semibold text-gray-500 underline hover:text-gray-700">
              {text.again}
            </button>
          )
        )}
      </div>

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-[#123b35] px-4 py-3 text-sm text-white shadow-2xl">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700" aria-hidden="true">✓</span>
          <span className="min-w-0 flex-1">
            <strong className="block">{text.toastTitle}</strong>
            <span className="text-white/80">{text.toastBody}</span>
          </span>
          <button type="button" onClick={() => setToast(false)} aria-label="Tutup" className="text-white/70 hover:text-white">✕</button>
        </div>
      )}
    </>
  )
}
