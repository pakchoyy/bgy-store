import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { product_id, buyer_name, buyer_whatsapp, buyer_email, voucher_code } = body
    const cleanWhatsapp = String(buyer_whatsapp || '').replace(/[^\d+]/g, '')

    if (!product_id) return NextResponse.json({ error: 'product_id diperlukan' }, { status: 400 })
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
    if (typeof product_id !== 'string' || product_id.length > 64) {
      return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 })
    }

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url'

    if (!hasSupabase) {
      return NextResponse.json({ error: 'Database belum dikonfigurasi' }, { status: 500 })
    }

    const { createTrustedServerClient } = await import('@/lib/supabase-server')
    const supabase = await createTrustedServerClient()

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, type, sale_price, stock_type, stock_qty')
      .eq('id', product_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (productError || !product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    if (product.type !== 'paid') return NextResponse.json({ error: 'Produk bukan produk berbayar' }, { status: 400 })
    if (product.stock_type === 'limited' && product.stock_qty <= 0) {
      return NextResponse.json({ error: 'Sold Out' }, { status: 400 })
    }

    let amount = product.sale_price
    let voucherCode = null
    let discountAmount = 0
    if (voucher_code) {
      voucherCode = String(voucher_code).trim().toUpperCase().slice(0, 64)
      const { data: voucher } = await supabase.from('vouchers').select('*').eq('code', voucherCode).eq('is_active', true).maybeSingle()
      if (!voucher) return NextResponse.json({ error: 'Voucher tidak ditemukan atau sudah tidak aktif' }, { status: 400 })
      const now = new Date()
      if ((voucher.starts_at && new Date(voucher.starts_at) > now) || (voucher.ends_at && new Date(voucher.ends_at) < now) || (voucher.max_uses && voucher.used_count >= voucher.max_uses)) return NextResponse.json({ error: 'Voucher sudah tidak berlaku' }, { status: 400 })
      if (amount < Number(voucher.min_order_amount || 0)) return NextResponse.json({ error: 'Minimal belanja untuk voucher belum terpenuhi' }, { status: 400 })
      const discount = voucher.discount_type === 'fixed' ? Number(voucher.discount_value) : Math.floor(amount * Number(voucher.discount_value) / 100)
      discountAmount = Math.min(amount, discount)
      amount = Math.max(0, amount - discountAmount)
    }
    const name = product.title
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bgy-store.vercel.app'
    const { hasMayarApiKey, createPaymentLink, extractMayarInvoice } = await import('@/lib/mayar')

    if (!hasMayarApiKey()) {
      return NextResponse.json({ error: 'Pembayaran belum dikonfigurasi. Hubungi admin.' }, { status: 500 })
    }
    if (amount < 1000) {
      return NextResponse.json({ error: 'Total pembayaran minimal Rp1.000' }, { status: 400 })
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

    try {
      const redirectUrl = `${siteUrl}/terima-kasih?order=${order.id}`
      const mayarResponse = await createPaymentLink({
        amount,
        name,
        description: `Pembelian ${name}`,
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
      return NextResponse.json({ error: e.message || 'Gagal membuat pembayaran Mayar' }, { status: 502 })
    }
  } catch (err) {
    console.error('checkout error:', err)
    return NextResponse.json({ error: 'Pesanan belum dapat diproses. Coba lagi.' }, { status: 500 })
  }
}
