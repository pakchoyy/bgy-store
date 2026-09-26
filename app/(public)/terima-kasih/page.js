import LynkShell from '@/components/public/LynkShell'
import ProductStack from '@/components/public/ProductStack'
import ProductReviewForm from '@/components/public/ProductReviewForm'
import { demoProducts } from '@/lib/demo-data'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'
import { parseSocialLinks } from '@/lib/utils'
import Link from 'next/link'
import PaymentWaiter from '@/components/public/PaymentWaiter'
import DownloadReady from '@/components/public/DownloadReady'

export const dynamic = 'force-dynamic'

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
        product_id: demoProducts[0].id,
        product: demoProducts[0],
      },
    }
  }

  const shell = await fetchStoreShell()
  const { createTrustedServerClient, hasServiceRole } = await import('@/lib/supabase-server')
  const supabase = await createTrustedServerClient()

  if (orderId && !/^[0-9a-f-]{36}$/i.test(orderId)) return { ...shell, order: null }
  if (token && token.length > 256) return { ...shell, order: null }

  let query = supabase
    .from('orders')
    .select('id, buyer_name, status, amount, product_id, download_token, token_expires_at, product:products(id, title, slug)')

  query = token ? query.eq('download_token', token) : query.eq('id', orderId)

  let { data: order } = await query.maybeSingle()

  if (order?.status === 'pending' && hasServiceRole()) {
    const { syncOrderWithMayar } = await import('@/lib/orders')
    const status = await syncOrderWithMayar(supabase, order.id).catch(() => null)
    if (status === 'paid') {
      const { data: fresh } = await supabase
        .from('orders')
        .select('id, buyer_name, status, amount, product_id, download_token, token_expires_at, product:products(id, title, slug)')
        .eq('id', order.id)
        .maybeSingle()
      order = fresh || order
    }
  }

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

function StatusIcon({ tone, children }) {
  const tones = { green: 'bg-emerald-100 text-emerald-600', amber: 'bg-amber-100 text-amber-600', red: 'bg-red-100 text-red-600' }
  return (
    <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${tones[tone]}`} aria-hidden="true">
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">{children}</svg>
    </div>
  )
}

const checkPath = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
const clockPath = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
const alertPath = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />

const waButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white'

export default async function TerimaKasihPage({ searchParams }) {
  const token = searchParams?.token || ''
  const orderId = searchParams?.order || ''
  const fileId = searchParams?.file || ''
  const data = await getOrder({ token, orderId })
  const { order, navItems, appearance, footerConfig, announcement, products } = data
  const isDonation = order && !order.product_id
  const freeFile = isDonation && fileId
    ? (products || []).find((p) => p.id === fileId && p.type === 'free') || null
    : null
  const recommended = (products || [])
    .filter((p) => p.is_active && p.id !== order?.product?.id && p.id !== freeFile?.id)
    .slice(0, 3)
  const isPaid = order?.status === 'paid' && (isDonation || order.download_token)
  const isPending = order?.status === 'pending'
  const isFailed = order && ['failed', 'expired'].includes(order.status)
  const waUrl = getWhatsAppUrl(appearance)

  return (
    <LynkShell
      appearance={appearance}
      navItems={navItems}
      footerConfig={footerConfig}
      announcement={announcement}
      topBarTitle="Terima Kasih"
      pageHasHeading
    >
      <div className="space-y-4">
        <div className="bg-white/95 rounded-2xl shadow-sm p-6 text-center">
          {isPaid && isDonation ? (
            <>
              <StatusIcon tone="green">{checkPath}</StatusIcon>
              <h1 className="text-lg font-bold text-gray-900">Terima kasih sudah traktir kopi! ☕</h1>
              <p className="mt-1 text-sm text-gray-600">
                Dukunganmu bikin Pak Choy makin semangat berkarya{order.buyer_name && order.buyer_name !== 'Pendukung BGY' ? `, ${order.buyer_name}` : ''}.
              </p>
              {freeFile && <DownloadReady freeProductId={freeFile.id} title={freeFile.title} />}
            </>
          ) : isPaid ? (
            <>
              <StatusIcon tone="green">{checkPath}</StatusIcon>
              <h1 className="text-lg font-bold text-gray-900">Pembayaran Berhasil!</h1>
              <p className="mt-1 text-sm text-gray-600">
                Terima kasih, <span className="font-semibold">{order.buyer_name}</span>!
              </p>
              <DownloadReady token={order.download_token} title={order.product?.title} />
            </>
          ) : isPending ? (
            <>
              <StatusIcon tone="amber">{clockPath}</StatusIcon>
              <h1 className="text-lg font-bold text-gray-900">Menunggu Pembayaran</h1>
              <p className="mt-1 text-sm text-gray-600">
                {isDonation
                  ? 'Selesaikan pembayaran QRIS. Setelah berhasil, file langsung bisa diunduh di halaman ini.'
                  : 'Selesaikan pembayaran di Mayar. Setelah berhasil, tombol download muncul otomatis di halaman ini.'}
              </p>
              <PaymentWaiter orderId={order.id} />
              <div className="mt-4">
                <a
                  href={`${waUrl}?text=${encodeURIComponent(`Halo, saya butuh bantuan cek pembayaran order ${order.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#0d7a8a] underline underline-offset-2"
                >
                  Sudah bayar tapi belum berubah? Hubungi WhatsApp
                </a>
              </div>
            </>
          ) : isFailed ? (
            <>
              <StatusIcon tone="red">{alertPath}</StatusIcon>
              <h1 className="text-lg font-bold text-gray-900">Pembayaran Tidak Berhasil</h1>
              <p className="mt-1 mb-4 text-sm text-gray-600">
                Pembayaran gagal atau sudah kedaluwarsa. Silakan ulangi dari halaman produk.
              </p>
              <Link href={order.product?.slug ? `/produk/${order.product.slug}` : '/produk'} className={waButton}>
                Coba Lagi
              </Link>
            </>
          ) : (
            <>
              <StatusIcon tone="red">{alertPath}</StatusIcon>
              <h1 className="text-lg font-bold text-gray-900">Tautan Tidak Valid</h1>
              <p className="mt-1 mb-4 text-sm text-gray-600">
                Tautan tidak valid atau kedaluwarsa. Hubungi kami jika sudah bayar.
              </p>
              <a
                href={`${waUrl}?text=${encodeURIComponent('Halo, saya butuh bantuan download produk')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={waButton}
              >
                Hubungi WhatsApp
              </a>
            </>
          )}
        </div>

        {isPaid && order?.product && (
          <div>
            <p className="mb-2 inline-block rounded-full bg-[#123b35] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
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
            <p className="mb-2 inline-block rounded-full bg-[#123b35] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              Produk Lainnya
            </p>
            <ProductStack products={recommended} />
          </div>
        )}
      </div>
    </LynkShell>
  )
}
