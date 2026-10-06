'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CloseButton } from '@/components/ui/close-button'
import { setGlobalConfirmer } from '@/lib/confirm-request'

const ConfirmContext = createContext(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const [draft, setDraft] = useState('')

  const close = useCallback((value) => {
    setDialog((current) => {
      if (current) current.resolve(value)
      return null
    })
  }, [])

  const confirm = useCallback(
    ({ title = 'Yakin?', message = '', confirmLabel = 'Ya, lanjutkan', danger = false } = {}) =>
      new Promise((resolve) => {
        setDialog({ type: 'confirm', title, message, confirmLabel, danger, resolve })
      }),
    []
  )

  const promptText = useCallback(
    ({ title = 'Masukkan nilai', message = '', placeholder = '', defaultValue = '', confirmLabel = 'Simpan' } = {}) => {
      setDraft(defaultValue)
      return new Promise((resolve) => {
        setDialog({ type: 'prompt', title, message, placeholder, confirmLabel, resolve })
      })
    },
    []
  )

  useEffect(() => {
    setGlobalConfirmer((message) => confirm({ title: 'Tinggalkan halaman?', message, confirmLabel: 'Ya, tinggalkan', danger: true }))
    return () => setGlobalConfirmer(null)
  }, [confirm])

  useEffect(() => {
    if (!dialog) return
    const onKey = (e) => {
      if (e.key === 'Escape') close(dialog.type === 'prompt' ? null : false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, close])

  return (
    <ConfirmContext.Provider value={{ confirm, promptText }}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={() => close(dialog.type === 'prompt' ? null : false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={dialog.title}
            className="my-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 px-5 pt-4">
              <span
                aria-hidden="true"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                  dialog.danger ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-700'
                }`}
              >
                {dialog.type === 'prompt' ? '✎' : dialog.danger ? '!' : '?'}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-900">{dialog.title}</h2>
                {!!dialog.message && <p className="mt-1 text-sm leading-relaxed text-slate-600">{dialog.message}</p>}
              </div>
              <CloseButton onClick={() => close(dialog.type === 'prompt' ? null : false)} className="h-7 w-7" />
            </div>
            {dialog.type === 'prompt' && (
              <div className="px-5 pt-3">
                <Input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={dialog.placeholder}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      close(draft)
                    }
                  }}
                />
              </div>
            )}
            <div className="flex gap-2 px-5 py-4">
              <Button variant="outline" className="flex-1" onClick={() => close(dialog.type === 'prompt' ? null : false)}>
                Batal
              </Button>
              <Button
                autoFocus={dialog.type !== 'prompt'}
                className={`flex-1 ${dialog.danger ? 'bg-red-600 hover:bg-red-700' : ''}`}
                onClick={() => {
                  if (dialog.type === 'prompt') close(draft)
                  else close(true)
                }}
              >
                {dialog.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
