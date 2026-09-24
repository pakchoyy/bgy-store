import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { product_id, buyer_name, buyer_whatsapp, buyer_email } = body

    if (!product_id) return NextResponse.json({ error: 'product_id diperlukan' }, { status: 400 })
    if (!buyer_name?.trim()) return NextResponse.json({ error: 'Nama pembeli diperlukan' }, { status: 400 })
    if (!buyer_whatsapp?.trim()) return NextResponse.json({ error: 'Nomor WhatsApp diperlukan' }, { status: 400 })
    if (!buyer_email?.trim()) return NextResponse.json({ error: 'Email pembeli diperlukan' }, { status: 400 })

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url'

    if (!hasSupabase) {
      return NextResponse.json({ error: 'Database belum dikonfigurasi' }, { status: 500 })
    }

    const { createClient } = await import('@/lib/supabase-server')
    const supabase = await createClient()

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (productError || !product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    if (product.type !== 'paid') return NextResponse.json({ error: 'Produk bukan produk berbayar' }, { status: 400 })
    if (product.stock_type === 'limited' && product.stock_qty <= 0) {
      return NextResponse.json({ error: 'Sold Out' }, { status: 400 })
    }

    const amount = product.sale_price
    const name = product.title
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bgy-store.vercel.app'
    const { hasMayarApiKey, createPaymentLink, extractMayarInvoice } = await import('@/lib/mayar')

    if (!hasMayarApiKey()) {
      return NextResponse.json({ error: 'Mayar API key belum dikonfigurasi' }, { status: 500 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id: product.id,
        buyer_name: buyer_name.trim(),
        buyer_whatsapp: buyer_whatsapp.trim(),
        buyer_email: buyer_email.trim(),
        amount,
        status: 'pending',
        payment_method: 'mayar',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('checkout order insert error:', orderError)
      return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 })
    }

    try {
      const redirectUrl = `${siteUrl}/terima-kasih?order=${order.id}`
      const mayarResponse = await createPaymentLink({
        amount,
        name,
        description: `Pembelian ${name}`,
        redirectUrl,
        referenceId: order.id,
        customer: { name: buyer_name.trim(), email: buyer_email.trim(), phone: buyer_whatsapp.trim() },
      })
      const { paymentUrl, invoiceId } = extractMayarInvoice(mayarResponse)

      if (!paymentUrl) {
        throw new Error('Tautan pembayaran Mayar tidak tersedia')
      }

      await supabase
        .from('orders')
        .update({
          mayar_order_id: invoiceId || null,
          mayar_payment_id: invoiceId || null,
          payment_id: invoiceId || null,
          payment_url: paymentUrl,
        })
        .eq('id', order.id)

      return NextResponse.json({ payment_url: paymentUrl, order_id: order.id })
    } catch (e) {
      console.error('checkout mayar error:', e)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id)
      return NextResponse.json({ error: e.message || 'Gagal membuat pembayaran Mayar' }, { status: 502 })
    }
  } catch (err) {
    console.error('checkout error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
