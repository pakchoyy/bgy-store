'use client'

import { useEffect } from 'react'
import { rememberVoucher } from '@/lib/voucher-memory'

export default function VoucherCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('v')
    if (code) rememberVoucher(code)
  }, [])
  return null
}
