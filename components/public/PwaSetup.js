'use client'

import { useEffect, useState } from 'react'

const DISMISS_KEY = 'bgy-install-dismissed'

export default function PwaSetup() {
  const [installEvent, setInstallEvent] = useState(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    const onPrompt = (event) => {
      event.preventDefault()
      try {
        if (localStorage.getItem(DISMISS_KEY)) return
      } catch {}
      setInstallEvent(event)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!installEvent) return null

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
    setInstallEvent(null)
  }

  return (
    <div role="dialog" aria-label="Pasang aplikasi" className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-black/5">
      <img src="/pwa-icon?size=192" alt="" className="h-11 w-11 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">Pasang di layar HP</p>
        <p className="text-xs text-slate-500">Buka toko lebih cepat seperti aplikasi.</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          installEvent.prompt()
          await installEvent.userChoice.catch(() => null)
          dismiss()
        }}
        className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
      >
        Pasang
      </button>
      <button type="button" onClick={dismiss} aria-label="Tutup" className="px-1 text-slate-400 hover:text-slate-600">✕</button>
    </div>
  )
}
