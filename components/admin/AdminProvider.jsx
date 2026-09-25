'use client'

import { ToastProvider } from '@/components/ui/toast'

export function AdminProvider({ children }) {
  return <ToastProvider>{children}</ToastProvider>
}
