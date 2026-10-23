import { rateLimited, tooMany } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/site'

export async function POST(request) {
  if (rateLimited(request, 'checkout', 15, 10 * 60 * 1000)) return tooMany()
  try {
    const body = await request.json()
    const { product_id, product_ids, buyer_name, buyer_whatsapp, buyer_email, voucher_code } = body
    const requestedIds = [...new Set((Array.isArray(product_ids) && product_ids.length ? product_ids : [product_id]).filter((id) => typeof id === 'string' && id.length <= 64))].slice(0, 20)
    const cleanWhatsapp = String(buyer_whatsapp || '').replace(/[^\d+]/g, '')

    if (!requestedIds.length) return NextResponse.json({ error: 'Produk belum dipilih' }, { status: 400 })
    if (!buyer_name?.trim()) return NextResponse.json({ error: 'Nama pembeli diperlukan' }, { status: 400 })
    if (!buyer_whatsapp?.trim()) return NextResponse.json({ error: 'Nomor WhatsApp diperlukan' }, { status: 400 })
    if (cleanWhatsapp.replace(/\D/g, '').length < 8) return NextResponse.json({ error: 'Nomor WhatsApp tidak valid' }, { status: 400 })
    if (!buyer_email?.trim()) return NextResponse.json({ error: 'Email pembeli diperlukan' }, { status: 400 })
    if (typeof buyer_email !== 'string' || buyer_email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer_email.trim())) {
      return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 })
    }
    if (typeof buyer_name !== 'string' || buyer_name.trim().length > 120) {
      return NextResponse.json({ error: 'Nama terlalu panjang' }, { status: 400 })
    }

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url'

    if (!hasSupabase) {
      return NextResponse.json({ error: 'Database belum dikonfigurasi' }, { status: 500 })
    }

    const { createTrustedServerClient } = await import('@/lib/supabase-server')
    const supabase = await createTrustedServerClient()

    const productQuery = (columns) => supabase
      .from('products')
      .select(columns)
      .in('id', requestedIds)
      .eq('is_active', true)
      .is('deleted_at', null)
    let { data: found, error: productError } = await productQuery('id, title, type, sale_price, stock_type, stock_qty, flash_price, flash_ends_at')
    if (productError) ({ data: found, error: productError } = await productQuery('id, title, type, sale_price, stock_type, stock_qty'))

    const items = requestedIds.map((id) => (found || []).find((p) => p.id === id)).filter(Boolean)
    if (productError || items.length !== requestedIds.length) {
      return NextResponse.json({ error: 'Ada produk yang sudah tidak tersedia. Hapus dari keranjang lalu coba lagi.' }, { status: 404 })
    }
    const notPaid = items.find((p) => p.type !== 'paid')
    if (notPaid) return NextResponse.json({ error: `${notPaid.title} adalah produk gratis, tidak perlu dibeli.` }, { status: 400 })
    const soldOut = items.find((p) => p.stock_type === 'limited' && p.stock_qty <= 0)
    if (soldOut) return NextResponse.json({ error: `${soldOut.title} sudah habis.` }, { status: 400 })
    const product = items[0]
    const isCart = items.length > 1

    let voucher = null
    let voucherCode = null
    if (voucher_code) {
      voucherCode = String(voucher_code).trim().toUpperCase().slice(0, 64)
      const { data } = await supabase.from('vouchers').select('*').eq('code', voucherCode).eq('is_active', true).maybeSingle()
      if (!data) return NextResponse.json({ error: 'Voucher tidak ditemukan atau sudah tidak aktif' }, { status: 400 })
      const { isOwnReferral } = await import('@/lib/referral')
      if (isOwnReferral(data, buyer_email)) return NextResponse.json({ error: 'Kode referral tidak bisa dipakai untuk pembelianmu sendiri. Bagikan ke teman ya!' }, { status: 400 })
      voucher = data
    }
    const { computeTotal, effectivePrice } = await import('@/lib/pricing.mjs')
    const totals = computeTotal(items, voucher)
    if (totals.error) return NextResponse.json({ error: totals.error }, { status: 400 })
    const amount = totals.total
    const discountAmount = totals.discount
    const name = isCart ? `${items.length} produk: ${items.map((p) => p.title).join(', ')}`.slice(0, 200) : product.title
    const siteUrl = SITE_URL
    const { hasMayarApiKey, createPaymentLink, extractMayarInvoice } = await import('@/lib/mayar')

    if (!hasMayarApiKey()) {
      return NextResponse.json({ error: 'Pembayaran belum dikonfigurasi. Hubungi admin.' }, { status: 500 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id: product.id,
        buyer_name: buyer_name.trim(),
        buyer_whatsapp: cleanWhatsapp.slice(0, 25),
        buyer_email: buyer_email.trim(),
        amount,
        voucher_code: voucherCode,
        discount_amount: discountAmount,
        status: 'pending',
        payment_method: 'mayar',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('checkout order insert error:', orderError)
      return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 })
    }

    if (isCart) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items.map((p) => ({ order_id: order.id, product_id: p.id, title: p.title, price: effectivePrice(p).price })))
      if (itemsError) {
        console.error('checkout order_items insert error:', itemsError)
        await supabase.from('orders').delete().eq('id', order.id)
        return NextResponse.json({ error: 'Checkout keranjang belum aktif. Beli produk satu per satu dulu, atau hubungi admin.' }, { status: 500 })
      }
    }

    if (amount === 0) {
      const { data: fullOrder } = await supabase.from('orders').select('*, product:products(*)').eq('id', order.id).single()
      const { markOrderPaid } = await import('@/lib/orders')
      try {
        await markOrderPaid(supabase, fullOrder, {})
      } catch (e) {
        console.error('free voucher order error:', e)
        return NextResponse.json({ error: 'Gagal memproses voucher. Hubungi admin.' }, { status: 500 })
      }
      return NextResponse.json({ redirect_url: `/terima-kasih?order=${order.id}`, order_id: order.id })
    }

    try {
      const redirectUrl = `${siteUrl}/terima-kasih?order=${order.id}`
      const mayarResponse = await createPaymentLink({
        amount,
        name,
        description: isCart ? `Pembelian ${items.length} produk Kreacy` : `Pembelian ${name}`,
        redirectUrl,
        customer: { name: buyer_name.trim(), email: buyer_email.trim(), phone: cleanWhatsapp },
      })
      const { paymentUrl, invoiceId, transactionId } = extractMayarInvoice(mayarResponse)

      if (!paymentUrl) {
        throw new Error('Tautan pembayaran Mayar tidak tersedia')
      }

      await supabase
        .from('orders')
        .update({
          mayar_order_id: invoiceId || null,
          mayar_payment_id: transactionId || invoiceId || null,
          payment_id: transactionId || invoiceId || null,
          payment_url: paymentUrl,
        })
        .eq('id', order.id)

      return NextResponse.json({ payment_url: paymentUrl, order_id: order.id })
    } catch (e) {
      console.error('checkout mayar error:', e)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id)
      console.error('[mayar] create payment failed:', e); return NextResponse.json({ error: 'Pembayaran belum bisa dibuat. Coba lagi sebentar lagi.' }, { status: 502 })
    }
  } catch (err) {
    console.error('checkout error:', err)
    return NextResponse.json({ error: 'Pesanan belum dapat diproses. Coba lagi.' }, { status: 500 })
  }
}
