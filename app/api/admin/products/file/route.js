import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'
import { safeUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const SHARE_TTL_SECONDS = 7 * 24 * 60 * 60

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') || ''
  const mode = searchParams.get('mode') === 'download' ? 'download' : 'share'

  const supabase = await createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const service = await createServiceClient()
  const { data: product } = await service
    .from('products')
    .select('id, title, file_url, file_path, file_name')
    .eq('id', id)
    .maybeSingle()
  if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })

  const external = safeUrl(product.file_url)
  if (external && /^https:/i.test(external)) {
    return mode === 'download'
      ? NextResponse.redirect(external, 302)
      : NextResponse.json({ url: external, kind: 'link', title: product.title })
  }
  if (!product.file_path) return NextResponse.json({ error: 'Produk ini belum punya file atau link.' }, { status: 404 })

  const { data, error } = await service.storage
    .from('product-files')
    .createSignedUrl(product.file_path, mode === 'download' ? 600 : SHARE_TTL_SECONDS, {
      download: product.file_name || true,
    })
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'Gagal membuat link file.' }, { status: 500 })

  return mode === 'download'
    ? NextResponse.redirect(data.signedUrl, 302)
    : NextResponse.json({ url: data.signedUrl, kind: 'file', title: product.title, file_name: product.file_name }, { headers: { 'Cache-Control': 'no-store' } })
}
