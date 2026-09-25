import LynkShell from '@/components/public/LynkShell'
import ProductStack from '@/components/public/ProductStack'
import ProductReviewForm from '@/components/public/ProductReviewForm'
import { demoProducts } from '@/lib/demo-data'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'
import { parseSocialLinks } from '@/lib/utils'
import Link from 'next/link'

async function getOrder({ token, orderId }) {
  if (!hasSupabase() || (!token && !orderId)) {
    if (!token && !orderId) return { ...demoShellData(), order: null }
    return {
      ...demoShellData(),
      order: {
        id: 'demo-order-001',
        buyer_name: 'Budi Guru',
        buyer_whatsapp: '6281234567890',
        status: 'paid',
        download_token: 'demo-download-token-abc123',
        token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        product: demoProducts[0],
      },
    }
  }

  const shell = await fetchStoreShell()
  const { createClient } = await import('@/lib/supabase-server')
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('*, product:products(*)')

  query = token ? query.eq('download_token', token) : query.eq('id', orderId)

  const { data: order } = await query.maybeSingle()

  return { ...shell, order: order || null }
}

function getWhatsAppUrl(appearance) {
  const links = parseSocialLinks(appearance?.socialLinks || [])
  const wa = links.find((l) => l.platform === 'whatsapp')
  if (wa?.url) {
    if (wa.url.includes('http')) return wa.url
    return `https://wa.me/${wa.url.replace(/\D/g, '')}`
  }
  return 'https://wa.me/6281234567890'
}

export default async function TerimaKasihPage({ searchParams }) {
  const token = searchParams?.token || ''
  const orderId = searchParams?.order || ''
  const data = await getOrder({ token, orderId })
  const { order, navItems, appearance, footerConfig, announcement } = data
  const recommended = demoProducts
    .filter((p) => p.is_active && p.id !== order?.product?.id)
    .slice(0, 3)
  const isPaid = order && order.status === 'paid' && order.download_token
  const isPending = order && order.status === 'pending'
  const waUrl = getWhatsAppUrl(appearance)

  return (
    <LynkShell
      appearance={appearance}
      navItems={navItems}
      footerConfig={footerConfig}
      announcement={announcement}
    >
      <div className="space-y-4">
        <div className="bg-white/95 rounded-2xl shadow-sm p-6 text-center">
          {isPaid ? (
            <>
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-lg font-extrabold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
              <p className="text-sm text-gray-600 mb-4">
                Terima kasih, <span className="font-semibold">{order.buyer_name}</span>!
              </p>
              <Link
                href={`/api/download?token=${order.download_token}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0ea5a0] to-[#0d7a8a] text-white font-bold px-5 py-2.5 rounded-xl text-sm"
              >
                Download Sekarang
              </Link>
            </>
          ) : isPending ? (
            <>
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-lg font-extrabold text-gray-900 mb-2">Menunggu Pembayaran</h1>
              <p className="text-sm text-gray-600 mb-4">
                Pesanan kamu sudah tercatat. Setelah pembayaran Mayar sukses, link download akan muncul di halaman ini.
              </p>
              <a
                href={`${waUrl}?text=${encodeURIComponent(`Halo, saya butuh bantuan cek pembayaran order ${order.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
              >
                Hubungi WhatsApp
              </a>
            </>
          ) : (
            <>
              <h1 className="text-lg font-extrabold text-gray-900 mb-2">Token Tidak Valid</h1>
              <p className="text-sm text-gray-600 mb-4">
                Tautan tidak valid atau kedaluwarsa. Hubungi kami jika sudah bayar.
              </p>
              <a
                href={`${waUrl}?text=${encodeURIComponent('Halo, saya butuh bantuan download produk')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
              >
                Hubungi WhatsApp
              </a>
            </>
          )}
        </div>

        {isPaid && order?.product && (
          <div>
            <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2 px-1">
              Bagikan Pengalaman
            </p>
            <ProductReviewForm
              productId={order.product.id}
              orderId={order.id}
            />
          </div>
        )}

        {recommended.length > 0 && (
          <div>
            <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2 px-1">
              Produk Lainnya
            </p>
            <ProductStack products={recommended} />
          </div>
        )}
      </div>
    </LynkShell>
  )
}
