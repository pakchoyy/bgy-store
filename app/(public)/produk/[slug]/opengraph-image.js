import { ImageResponse } from 'next/og'
import { demoProducts } from '@/lib/demo-data'

export const runtime = 'edge'
export const alt = 'Produk Bantu Guru Yuk'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const plain = (text) => String(text || '').replace(/[^\p{L}\p{N}\p{P}\p{Zs}]/gu, '').replace(/\s+/g, ' ').trim()
const rupiah = (value) => `Rp${Number(value || 0).toLocaleString('id-ID')}`

async function loadProduct(slug) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || url === 'your_supabase_url' || !key) return demoProducts.find((p) => p.slug === slug) || null
  const query = new URLSearchParams({
    select: 'title,type,sale_price,original_price,cover_path',
    slug: `eq.${slug}`,
    is_active: 'eq.true',
    limit: '1',
  })
  const response = await fetch(`${url}/rest/v1/products?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!response.ok) return null
  const rows = await response.json().catch(() => [])
  return rows[0] || null
}

export default async function Image({ params }) {
  const product = await loadProduct(params.slug)
  const title = plain(product?.title) || 'Bantu Guru Yuk'
  const isFree = product?.type === 'free' || !Number(product?.sale_price)
  const hasDiscount = !isFree && Number(product?.original_price) > Number(product?.sale_price)
  const cover = /^https:\/\//.test(product?.cover_path || '') ? product.cover_path : null

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg, #0ea5a0 0%, #123b35 100%)', padding: 48, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flex: 1, background: '#ffffff', borderRadius: 36, overflow: 'hidden' }}>
          {cover && (
            <div style={{ display: 'flex', width: 420, height: '100%', background: '#f1f5f9' }}>
              <img src={cover} width={420} height={534} style={{ objectFit: 'cover', width: 420, height: 534 }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: 48 }}>
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: '#0d7a8a', letterSpacing: 2 }}>BANTU GURU YUK</div>
            <div style={{ display: 'flex', fontSize: title.length > 60 ? 44 : 56, fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>{title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {hasDiscount && <div style={{ display: 'flex', fontSize: 30, color: '#94a3b8', textDecoration: 'line-through' }}>{rupiah(product.original_price)}</div>}
              <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, color: '#ffffff', background: '#10b981', borderRadius: 18, padding: '10px 28px' }}>
                {isFree ? 'GRATIS' : rupiah(product.sale_price)}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
