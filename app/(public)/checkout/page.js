import Link from 'next/link';
import CheckoutPage from '@/components/public/CheckoutPage';
import { demoProducts } from '@/lib/demo-data';
import { hasSupabase } from '@/lib/store-shell';
import { whatsappUrl, withEffectivePrice } from '@/lib/utils';

const COLUMNS = 'id,title,slug,type,sale_price,original_price,cover_path,stock_type,stock_qty';

async function getProducts({ slug, items }) {
  const ids = String(items || '').split(',').map((id) => id.trim()).filter((id) => /^[\w-]{1,64}$/.test(id)).slice(0, 20);
  if (!slug && !ids.length) return [];
  if (!hasSupabase()) {
    const active = demoProducts.filter((p) => p.is_active);
    return ids.length ? ids.map((id) => active.find((p) => p.id === id)).filter(Boolean) : active.filter((p) => p.slug === slug);
  }
  const { createClient } = await import('@/lib/supabase-server');
  const supabase = await createClient();
  let query = supabase.from('products').select(`${COLUMNS},flash_price,flash_ends_at`).eq('is_active', true).is('deleted_at', null);
  query = ids.length ? query.in('id', ids) : query.eq('slug', slug);
  let { data, error } = await query;
  if (error) {
    let retry = supabase.from('products').select(COLUMNS).eq('is_active', true).is('deleted_at', null);
    retry = ids.length ? retry.in('id', ids) : retry.eq('slug', slug);
    ({ data } = await retry);
  }
  const rows = (data || []).map((p) => withEffectivePrice(p));
  return ids.length ? ids.map((id) => rows.find((p) => p.id === id)).filter(Boolean) : rows.slice(0, 1);
}

export default async function CheckoutRoute({ searchParams }) {
  const products = (await getProducts({ slug: searchParams?.product, items: searchParams?.items })).filter((p) => p.type === 'paid');
  if (!products.length) {
    return <main className="flex min-h-screen items-center justify-center bg-[#eef7f5] px-4"><div className="rounded-2xl bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold text-slate-900">Produk tidak ditemukan</h1><p className="mt-2 text-sm text-slate-500">Kembali ke halaman produk dan coba lagi.</p><Link href="/produk" className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Lihat produk</Link></div></main>;
  }
  let waUrl = null;
  if (hasSupabase()) {
    const { createClient } = await import('@/lib/supabase-server');
    const supabase = await createClient();
    const { data } = await supabase.from('settings').select('key,value').eq('key', 'social_links').maybeSingle();
    waUrl = whatsappUrl(data?.value);
  }
  return <CheckoutPage products={products} waUrl={waUrl} />;
}
