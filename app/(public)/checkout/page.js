import Link from 'next/link';
import CheckoutPage from '@/components/public/CheckoutPage';
import { demoProducts } from '@/lib/demo-data';
import { hasSupabase } from '@/lib/store-shell';

async function getProduct(slug) {
  if (!slug) return null;
  if (!hasSupabase()) return demoProducts.find((product) => product.slug === slug && product.is_active) || null;
  const { createClient } = await import('@/lib/supabase-server');
  const supabase = await createClient();
  const { data } = await supabase.from('products').select('id,title,slug,type,sale_price,original_price,cover_path,stock_type,stock_qty').eq('slug', slug).eq('is_active', true).is('deleted_at', null).single();
  return data || null;
}

export default async function CheckoutRoute({ searchParams }) {
  const product = await getProduct(searchParams?.product);
  if (!product || product.type !== 'paid') {
    return <main className="flex min-h-screen items-center justify-center bg-[#eef7f5] px-4"><div className="rounded-2xl bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold text-slate-900">Produk tidak ditemukan</h1><p className="mt-2 text-sm text-slate-500">Kembali ke halaman produk dan coba lagi.</p><Link href="/produk" className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Lihat produk</Link></div></main>;
  }
  return <CheckoutPage product={product} />;
}
