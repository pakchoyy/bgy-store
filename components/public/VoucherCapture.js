'use client'

import { useEffect } from 'react'
import { rememberVoucher } from '@/lib/voucher-memory'

export default function VoucherCapture() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const code = q.get('v')
    if (code) rememberVoucher(code)
    // Kode affiliate Buat Soal dari link teman: disimpan 30 hari, dibaca saat checkout.
    const aff = String(q.get('aff') || '').trim().toUpperCase()
    if (/^[A-Z0-9][A-Z0-9-]{2,14}$/.test(aff)) {
      document.cookie = `bgy_aff=${aff}; max-age=${60 * 60 * 24 * 30}; path=/; samesite=lax; secure`
    }
  }, [])
  return null
}
