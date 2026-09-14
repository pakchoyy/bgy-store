export function navigationHref(item) {
  const url = item.target_url?.trim();
  if (url && ((url.startsWith('/') && !url.startsWith('//')) || /^https?:\/\//i.test(url))) return url;
  const prefix = { product: '/produk', category: '/kategori', page: '/halaman' }[item.target_type];
  const slug = item.target_slug || item.target_id;
  return prefix && slug ? `${prefix}/${encodeURIComponent(slug)}` : '/';
}
