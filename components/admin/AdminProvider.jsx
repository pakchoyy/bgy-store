'use client'

import { ToastProvider, Toaster } from '@/components/ui/toast'

export function AdminProvider({ children }) {
  return (
    <ToastProvider>
      {children}
      <Toaster />
    </ToastProvider>
  )
}
