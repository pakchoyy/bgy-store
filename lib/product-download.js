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
