import { createHmac } from 'crypto'
import { safeUrl } from '@/lib/utils'

const SIGNED_URL_TTL_SECONDS = 60 * 10

export async function resolveProductDownloadUrl(serviceClient, product) {
  if (!product) return null
  const external = safeUrl(product.file_url)
  if (external && /^https?:/i.test(external)) return external
  if (!product.file_path) return null

  const { data, error } = await serviceClient.storage
    .from('product-files')
    .createSignedUrl(product.file_path, SIGNED_URL_TTL_SECONDS, {
      download: product.file_name || true,
    })
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

// Link produk boleh berisi {order} dan {sig}: diganti ID pesanan + HMAC-nya agar
// penerima link (mis. klaim kode lisensi) bisa memastikan satu pesanan = satu klaim.
export function fillOrderPlaceholders(fileUrl, orderId) {
  if (!fileUrl || !/\{order\}|%7Border%7D/i.test(fileUrl)) return fileUrl
  // Link ke web BGY (bukan subdomain Presensi) memakai rahasia sendiri agar terpisah dari Presensi.
  const isBgy = /^https:\/\/(www\.)?bantuguruyuk\.web\.id\//i.test(fileUrl)
  const secret = (isBgy && process.env.KLAIM_HMAC_SECRET_BGY) || process.env.KLAIM_HMAC_SECRET
  if (!secret) return null
  const hmac = (msg) => createHmac('sha256', secret).update(msg).digest('hex')
  const sig = hmac(String(orderId))
  const filled = fileUrl
    .replace(/\{order\}|%7Border%7D/gi, encodeURIComponent(orderId))
    .replace(/\{sig\}|%7Bsig%7D/gi, sig)
  // sig2 mengikat token paket (?t=) ke pesanan, supaya t tidak bisa ditukar ke paket lain.
  const t = filled.match(/[?&]t=([^&#]*)/)
  if (!t || !/\{sig\}|%7Bsig%7D/i.test(fileUrl)) return filled
  return filled.replace(/(#|$)/, `&sig2=${hmac(`v2:${decodeURIComponent(t[1])}:${orderId}`)}$1`)
}
