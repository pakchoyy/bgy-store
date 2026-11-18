// Produk lisensi (kode aktivasi) beda dengan produk file: pembeli tidak mengunduh apa pun,
// tapi membuka link aktivasi. Ciri pastinya: link produk memuat {order} (diganti ID pesanan saat dibuka).
// Produk link tanpa {order} dikenali dari judulnya (mis. "Aktivasi SPMB Zone Pro").
export function isActivationProduct(product) {
  const url = String(product?.file_url || '')
  if (!url) return false
  if (/\{order\}|%7Border%7D/i.test(url)) return true
  return /aktivasi|unlock|lisensi/i.test(String(product?.title || ''))
}

// 'activation' bila semua isi pesanan produk lisensi, 'file' bila tidak ada satu pun, selain itu 'mixed'.
export function orderDeliveryKind(products) {
  const list = (products || []).filter(Boolean)
  if (!list.length) return 'file'
  const activation = list.filter(isActivationProduct).length
  return activation === list.length ? 'activation' : activation === 0 ? 'file' : 'mixed'
}
