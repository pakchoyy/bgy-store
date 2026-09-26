import { NextResponse } from 'next/server';
import { resolveProductDownloadUrl } from '@/lib/product-download';

export const dynamic = 'force-dynamic';

function fail(message, status) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function tryWatermarkedPdf(supabase, product, order) {
  if (!product?.file_path || product.file_url || !/\.pdf$/i.test(product.file_name || product.file_path)) return null;
  try {
    const { data: setting } = await supabase.from('settings').select('value').eq('key', 'pdf_watermark_enabled').maybeSingle();
    if (setting?.value !== 'true') return null;
    const { data: blob, error } = await supabase.storage.from('product-files').download(product.file_path);
    if (error || !blob) return null;
    const { watermarkPdf, MAX_WATERMARK_BYTES } = await import('@/lib/pdf-watermark');
    if (blob.size > MAX_WATERMARK_BYTES) return null;
    const bytes = await watermarkPdf(new Uint8Array(await blob.arrayBuffer()), { name: order.buyer_name, email: order.buyer_email });
    const fileName = (product.file_name || 'file.pdf').replace(/[^\w.\- ]+/g, '_');
    return new Response(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('watermark failed, falling back to original file:', err);
    return null;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const itemId = searchParams.get('item');

    if (!token || token.length > 256) {
      return fail('Token diperlukan', 400);
    }

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

    if (!hasSupabase) {
      if (token === 'demo-download-token-abc123' || token.startsWith('ORD-')) {
        return NextResponse.redirect('https://example.com/demo-file.pdf');
      }
      return fail('Token tidak valid atau kedaluwarsa', 403);
    }

    const { createServiceClient } = await import('@/lib/supabase-server');
    const supabase = await createServiceClient();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, token_expires_at, product_id, buyer_name, buyer_email, product:products(file_url, file_path, file_name)')
      .eq('download_token', token)
      .maybeSingle();

    if (orderError || !order) return fail('Token tidak valid', 403);
    if (order.status !== 'paid') return fail('Pesanan belum dibayar', 403);
    if (order.token_expires_at && new Date(order.token_expires_at) < new Date()) {
      return fail('Token sudah kedaluwarsa', 403);
    }

    let target = order.product;
    if (itemId && itemId !== order.product_id) {
      if (!/^[0-9a-f-]{36}$/i.test(itemId)) return fail('Item tidak valid', 400);
      const { getOrderDownloads } = await import('@/lib/orders');
      const allowed = await getOrderDownloads(supabase, order);
      if (!allowed.some((entry) => entry.product_id === itemId)) return fail('Produk tidak ada di pesanan ini', 403);
      const { data: product } = await supabase.from('products').select('file_url, file_path, file_name').eq('id', itemId).maybeSingle();
      if (!product) return fail('Produk tidak ditemukan', 404);
      target = product;
    }

    const watermarked = await tryWatermarkedPdf(supabase, target, order);
    if (watermarked) return watermarked;

    const downloadUrl = await resolveProductDownloadUrl(supabase, target);
    if (!downloadUrl) return fail('File tidak tersedia', 404);

    const response = NextResponse.redirect(downloadUrl, 302);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch (err) {
    console.error('download error:', err);
    return fail('Internal server error', 500);
  }
}
