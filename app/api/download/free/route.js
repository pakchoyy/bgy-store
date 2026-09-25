import { NextResponse } from 'next/server';
import { demoProducts } from '@/lib/demo-data';
import { resolveProductDownloadUrl } from '@/lib/product-download';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { product_id } = body;

    if (!product_id || typeof product_id !== 'string') {
      return NextResponse.json({ error: 'product_id diperlukan' }, { status: 400 });
    }

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

    if (!hasSupabase) {
      const product = demoProducts.find((p) => p.id === product_id);
      if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
      if (!product.is_active) return NextResponse.json({ error: 'Produk tidak aktif' }, { status: 400 });
      if (product.type !== 'free') return NextResponse.json({ error: 'Bukan produk gratis' }, { status: 400 });
      return NextResponse.json({ url: 'https://example.com/demo-free-file.pdf' });
    }

    const { createServiceClient } = await import('@/lib/supabase-server');
    const supabase = await createServiceClient();

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, file_url, file_path, file_name')
      .eq('id', product_id)
      .eq('is_active', true)
      .eq('type', 'free')
      .is('deleted_at', null)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    const downloadUrl = await resolveProductDownloadUrl(supabase, product);
    if (!downloadUrl) {
      return NextResponse.json({ error: 'File belum tersedia. Hubungi admin.' }, { status: 404 });
    }

    await supabase.rpc('increment_download_count', { p_product_id: product.id });

    return NextResponse.json({ url: downloadUrl }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('free download error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
