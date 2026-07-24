import { NextResponse } from 'next/server'
import { demoProducts } from '@/lib/demo-data'

export async function POST(request) {
  try {
    const body = await request.json()
    const { product_id, buyer_name, buyer_whatsapp, buyer_email } = body

    if (!product_id) return NextResponse.json({ error: 'product_id diperlukan' }, { status: 400 })
    if (!buyer_name?.trim()) return NextResponse.json({ error: 'Nama pembeli diperlukan' }, { status: 400 })
    if (!buyer_whatsapp?.trim()) return NextResponse.json({ error: 'Nomor WhatsApp diperlukan' }, { status: 400 })

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url'
    const hasMayar = !!process.env.MAYAR_API_KEY

    let product = null

    if (hasSupabase) {
      const { createClient } = await import('@/lib/supabase-server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', product_id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (!error && data) {
        product = data
      }
    }

    if (!product) {
      product = demoProducts.find((p) => p.id === product_id && p.is_active && p.type === 'paid') || null
    }

    if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    if (product.type !== 'paid') return NextResponse.json({ error: 'Produk bukan produk berbayar' }, { status: 400 })
    if (product.stock_type === 'limited' && product.stock_qty <= 0) {
      return NextResponse.json({ error: 'Sold Out' }, { status: 400 })
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const amount = product.sale_price
    const name = product.title
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bgy-store.vercel.app'
    const redirectUrl = `${siteUrl}/terima-kasih?token=`

    let paymentUrl
    let paymentId

    if (hasMayar) {
      try {
        const { createPaymentLink } = await import('@/lib/mayar')
        const mayarResponse = await createPaymentLink({
          amount,
          name,
          description: `Pembelian ${name}`,
          redirectUrl: redirectUrl + orderId,
          customer: { name: buyer_name.trim(), email: buyer_email || '', phone: buyer_whatsapp.trim() },
        })
        paymentUrl = mayarResponse.data?.url || mayarResponse.url
        paymentId = mayarResponse.data?.id || mayarResponse.id || orderId
      } catch (e) {
        console.error('checkout mayar error:', e)
        paymentUrl = `https://app.mayar.id/payment/demo?order=${orderId}`
        paymentId = `demo-${Date.now()}`
      }
    } else {
      paymentUrl = `https://app.mayar.id/payment/demo?order=${orderId}`
      paymentId = `demo-${Date.now()}`
    }

    if (hasSupabase) {
      try {
        const { createClient } = await import('@/lib/supabase-server')
        const supabase = await createClient()

        await supabase.from('orders').insert({
          id: orderId,
          product_id: product.id,
          buyer_name: buyer_name.trim(),
          buyer_whatsapp: buyer_whatsapp.trim(),
          buyer_email: buyer_email || null,
          amount,
          status: 'pending',
          payment_method: hasMayar ? 'mayar' : 'manual',
          payment_id: paymentId,
        })

        if (product.stock_type === 'limited') {
          await supabase.from('products').update({ stock_qty: product.stock_qty - 1 }).eq('id', product.id)
        }
      } catch (e) {
        console.error('checkout order insert error:', e)
      }
    }

    return NextResponse.json({ payment_url: paymentUrl, order_id: orderId })
  } catch (err) {
    console.error('checkout error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
