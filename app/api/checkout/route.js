import { NextResponse } from 'next/server'

export async function POST(request) {
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
    const { effectivePrice } = await import('@/lib/utils')
    found = (found || []).map((p) => ({ ...p, sale_price: effectivePrice(p).price }))

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

    let amount = items.reduce((sum, p) => sum + Number(p.sale_price || 0), 0)
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
    const name = isCart ? `${items.length} produk: ${items.map((p) => p.title).join(', ')}`.slice(0, 200) : product.title
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bgy-store.vercel.app'
    const { hasMayarApiKey, createPaymentLink, extractMayarInvoice } = await import('@/lib/mayar')

    if (!hasMayarApiKey()) {
      return NextResponse.json({ error: 'Pembayaran belum dikonfigurasi. Hubungi admin.' }, { status: 500 })
    }
    if (amount > 0 && amount < 1000) {
      return NextResponse.json({ error: 'Total pembayaran online minimal Rp1.000. Voucher ini membuat total terlalu kecil.' }, { status: 400 })
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
        .insert(items.map((p) => ({ order_id: order.id, product_id: p.id, title: p.title, price: Number(p.sale_price || 0) })))
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
        description: isCart ? `Pembelian ${items.length} produk Bantu Guru Yuk` : `Pembelian ${name}`,
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
