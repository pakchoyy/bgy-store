import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('X-Mayar-Signature') || '';

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

    if (!hasSupabase) {
      const data = JSON.parse(payload);
      console.log('[Mayar Webhook DEMO]', data);
      return NextResponse.json({ status: 'ok', message: 'Demo mode - webhook received' });
    }

    let parsed;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { verifyWebhookSignature } = await import('@/lib/mayar');
    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { order_id, status, payment_id } = parsed;
    if (!order_id) {
      return NextResponse.json({ error: 'order_id diperlukan' }, { status: 400 });
    }

    const { createServiceClient } = await import('@/lib/supabase-server');
    const supabase = await import('@/lib/supabase-server').then((m) => m.createServiceClient ? m.createServiceClient() : null);

    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    if (status === 'paid') {
      const downloadToken = `${order_id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_id: payment_id || null,
          paid_at: new Date().toISOString(),
          download_token: downloadToken,
          token_expires_at: expiresAt,
        })
        .eq('id', order_id);

      if (updateError) {
        return NextResponse.json({ error: 'Gagal memperbarui pesanan' }, { status: 500 });
      }

      const { data: order } = await supabase
        .from('orders')
        .select('*, product:products(*)')
        .eq('id', order_id)
        .single();

      if (order?.product) {
        const { error: notifError } = await supabase.from('notifications').insert({
          type: 'order_paid',
          title: `Pesanan Dibayar: ${order.product.title}`,
          message: `${order.buyer_name} telah melakukan pembayaran untuk ${order.product.title}`,
          data: { order_id, product_id: order.product.id, buyer_name: order.buyer_name },
        });

        if (notifError) {
          console.error('[Mayar Webhook] Failed to create notification:', notifError);
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[Mayar Webhook Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
