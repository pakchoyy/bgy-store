import { NextResponse } from 'next/server';
import { demoProducts } from '@/lib/demo-data';

export async function POST(request) {
  try {
    const body = await request.json();
    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'product_id diperlukan' }, { status: 400 });
    }

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

    if (!hasSupabase) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const product = demoProducts.find((p) => p.id === product_id);
      if (!product) {
        return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
      }
      if (!product.is_active) {
        return NextResponse.json({ error: 'Produk tidak aktif' }, { status: 400 });
      }
      if (product.type !== 'free') {
        return NextResponse.json({ error: 'Bukan produk gratis' }, { status: 400 });
      }

      return NextResponse.json({ url: 'https://example.com/demo-free-file.pdf' });
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
      .eq('type', 'free')
      .is('deleted_at', null)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    await supabase.rpc('increment_download_count', { product_id: product.id });

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
