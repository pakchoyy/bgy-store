import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token diperlukan' }, { status: 400 });
    }

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

    if (!hasSupabase) {
      if (token === 'demo-download-token-abc123') {
        return NextResponse.redirect('https://example.com/demo-file.pdf');
      }
      return NextResponse.json({ error: 'Token tidak valid atau kedaluwarsa' }, { status: 403 });
    }

    const { createServiceClient } = await import('@/lib/supabase-server');
    const supabase = await import('@/lib/supabase-server').then((m) => m.createServiceClient ? m.createServiceClient() : null);

    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, product:products(*)')
      .eq('download_token', token)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 403 });
    }

    if (order.status !== 'paid') {
      return NextResponse.json({ error: 'Pesanan belum dibayar' }, { status: 403 });
    }

    if (order.token_expires_at && new Date(order.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token sudah kedaluwarsa' }, { status: 403 });
    }

    const product = order.product;
    let downloadUrl;

    if (product.file_url) {
      downloadUrl = product.file_url;
    } else if (product.file_path) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      downloadUrl = `${supabaseUrl}/storage/v1/object/public/product-files/${product.file_path}`;
    } else {
      return NextResponse.json({ error: 'File tidak tersedia' }, { status: 404 });
    }

    return NextResponse.json({ url: downloadUrl });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
