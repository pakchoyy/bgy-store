import { NextResponse } from 'next/server';
import { demoProducts } from '@/lib/demo-data';

export async function POST(request) {
  try {
    const body = await request.json();
    const { product_id, buyer_name, buyer_whatsapp, buyer_email } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'product_id diperlukan' }, { status: 400 });
    }
    if (!buyer_name || !buyer_name.trim()) {
      return NextResponse.json({ error: 'Nama pembeli diperlukan' }, { status: 400 });
    }
    if (!buyer_whatsapp || !buyer_whatsapp.trim()) {
      return NextResponse.json({ error: 'Nomor WhatsApp diperlukan' }, { status: 400 });
    }

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

    if (!hasSupabase) {
      const product = demoProducts.find((p) => p.id === product_id);
      if (!product) {
        return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
      }
      if (!product.is_active) {
        return NextResponse.json({ error: 'Produk tidak aktif' }, { status: 400 });
      }
      if (product.type !== 'paid') {
        return NextResponse.json({ error: 'Produk bukan produk berbayar' }, { status: 400 });
      }
      if (product.stock_type === 'limited' && product.stock_qty <= 0) {
        return NextResponse.json({ error: 'Sold Out' }, { status: 400 });
      }

      return NextResponse.json({
        payment_url: `https://app.mayar.id/payment/demo?product=${product.slug}`,
        order_id: `demo-${Date.now()}`,
      });
    }

    const { createServiceClient } = await import('@/lib/supabase-server');
    const supabase = await import('@/lib/supabase-server').then((m) => m.createServiceClient ? m.createServiceClient() : null);

    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }
    if (product.type !== 'paid') {
      return NextResponse.json({ error: 'Produk bukan produk berbayar' }, { status: 400 });
    }
    if (product.stock_type === 'limited' && product.stock_qty <= 0) {
      return NextResponse.json({ error: 'Sold Out' }, { status: 400 });
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const amount = product.sale_price;
    const name = product.title;
    const description = `Pembelian ${product.title}`;
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bantuguruyuk.web.id'}/terima-kasih?token=`;
    const customer = { name: buyer_name.trim(), email: buyer_email || '', phone: buyer_whatsapp.trim() };

    const { createPaymentLink } = await import('@/lib/mayar');
    let paymentUrl;
    let paymentId;

    try {
      const mayarResponse = await createPaymentLink({ amount, name, description, redirectUrl: redirectUrl + orderId, customer });
      paymentUrl = mayarResponse.data?.url || mayarResponse.url;
      paymentId = mayarResponse.data?.id || mayarResponse.id || '';
    } catch {
      paymentUrl = `https://app.mayar.id/payment/demo?order=${orderId}`;
      paymentId = `demo-${Date.now()}`;
    }

    const { error: insertError } = await supabase.from('orders').insert({
      id: orderId,
      product_id: product.id,
      buyer_name: buyer_name.trim(),
      buyer_whatsapp: buyer_whatsapp.trim(),
      buyer_email: buyer_email || null,
      amount: product.sale_price,
      status: 'pending',
      payment_method: 'mayar',
      payment_id: paymentId,
    });

    if (insertError) {
      return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 });
    }

    if (product.stock_type === 'limited') {
      await supabase.from('products').update({ stock_qty: product.stock_qty - 1 }).eq('id', product.id);
    }

    return NextResponse.json({ payment_url: paymentUrl, order_id: orderId });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
