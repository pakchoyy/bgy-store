export const VOUCHER_KEY = 'bgy-voucher'

export function readRememberedVoucher() {
  try {
    const value = window.localStorage.getItem(VOUCHER_KEY) || ''
    return /^[A-Z0-9-]{3,32}$/.test(value) ? value : ''
  } catch {
    return ''
  }
}

export function rememberVoucher(code) {
  try {
    const value = String(code || '').trim().toUpperCase()
    if (/^[A-Z0-9-]{3,32}$/.test(value)) window.localStorage.setItem(VOUCHER_KEY, value)
  } catch {}
}
