import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { amount, buyer_name, buyer_whatsapp, buyer_email } = body
    const cleanAmount = Math.floor(Number(amount) || 0)
    const cleanWhatsapp = String(buyer_whatsapp || '').replace(/[^\d+]/g, '')

    if (cleanAmount < 1000) return NextResponse.json({ error: 'Nominal minimal Rp1.000' }, { status: 400 })
    if (!buyer_name?.trim()) return NextResponse.json({ error: 'Nama diperlukan' }, { status: 400 })
    if (!buyer_whatsapp?.trim()) return NextResponse.json({ error: 'Nomor WhatsApp diperlukan' }, { status: 400 })
    if (cleanWhatsapp.replace(/\D/g, '').length < 8) return NextResponse.json({ error: 'Nomor WhatsApp tidak valid' }, { status: 400 })
    if (!buyer_email?.trim()) return NextResponse.json({ error: 'Email diperlukan' }, { status: 400 })

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url'

    if (!hasSupabase) {
      return NextResponse.json({ error: 'Database belum dikonfigurasi' }, { status: 500 })
    }

    const { hasMayarApiKey, createPaymentLink, extractMayarInvoice } = await import('@/lib/mayar')

    if (!hasMayarApiKey()) {
      return NextResponse.json({ error: 'Mayar API key belum dikonfigurasi' }, { status: 500 })
    }

    const { createServiceClient } = await import('@/lib/supabase-server')
    const supabase = await createServiceClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id: null,
        buyer_name: buyer_name.trim(),
        buyer_whatsapp: cleanWhatsapp,
        buyer_email: buyer_email.trim(),
        amount: cleanAmount,
        status: 'pending',
        payment_method: 'mayar',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('traktir order insert error:', orderError)
      return NextResponse.json({ error: 'Gagal membuat donasi' }, { status: 500 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bgy-store.vercel.app'

    try {
      const redirectUrl = `${siteUrl}/terima-kasih?order=${order.id}`
      const mayarResponse = await createPaymentLink({
        amount: cleanAmount,
        name: 'Traktir Kopi',
        description: 'Traktir Kopi - Bantu Guru Yuk',
        redirectUrl,
        customer: { name: buyer_name.trim(), email: buyer_email.trim(), phone: cleanWhatsapp },
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
      console.error('traktir mayar error:', e)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id)
      return NextResponse.json({ error: e.message || 'Gagal membuat pembayaran Mayar' }, { status: 502 })
    }
  } catch (err) {
    console.error('traktir error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
