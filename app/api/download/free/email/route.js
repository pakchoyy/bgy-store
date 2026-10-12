import { NextResponse } from 'next/server';
import { rateLimited, tooMany } from '@/lib/rate-limit';

// Kirim link produk gratis (tipe tautan) ke email, hanya bila pengunjung memintanya.
export async function POST(request) {
  if (rateLimited(request, 'free-link-email', 3, 60 * 60 * 1000)) return tooMany();
  try {
    const { product_id, email } = await request.json().catch(() => ({}));
    const to = String(email || '').trim().slice(0, 254);
    if (!product_id || typeof product_id !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: 'Email belum valid.' }, { status: 400 });
    }

    const { createServiceClient } = await import('@/lib/supabase-server');
    const supabase = await createServiceClient();
    const { data: product } = await supabase
      .from('products')
      .select('title, file_url')
      .eq('id', product_id)
      .eq('is_active', true)
      .eq('type', 'free')
      .is('deleted_at', null)
      .maybeSingle();
    if (!product?.file_url) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });

    const { sendFreeLinkEmail, hasEmailSender } = await import('@/lib/email');
    if (!hasEmailSender()) return NextResponse.json({ error: 'Pengiriman email belum aktif.' }, { status: 503 });
    await sendFreeLinkEmail({ to, productTitle: product.title, linkUrl: product.file_url });
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('free link email error:', err);
    return NextResponse.json({ error: 'Email gagal dikirim. Coba lagi nanti.' }, { status: 500 });
  }
}
