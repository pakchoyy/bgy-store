// Pilih ulasan untuk Beranda: komentar yang sama (mis. satu ulasan BGY yang disalin ke produk PLUS dan PRO)
// hanya tampil sekali, dan satu penulis bernama maksimal satu kali supaya tidak itu-itu saja.
// rows harus sudah urut dari yang terbaru.
export function pickHomeReviews(rows, max = 8) {
  const seenComments = new Set()
  const seenNames = new Set()
  const picked = []
  for (const row of rows || []) {
    const comment = String(row.comment || '').trim()
    if (comment.length < 10) continue
    const commentKey = comment.toLowerCase().replace(/\s+/g, ' ')
    if (seenComments.has(commentKey)) continue
    const name = String(row.reviewer_name || '').trim().toLowerCase()
    const anonymous = !name || name === 'guru pengguna bgy'
    if (!anonymous && seenNames.has(name)) continue
    seenComments.add(commentKey)
    if (!anonymous) seenNames.add(name)
    picked.push(row)
    if (picked.length >= max) break
  }
  return picked
}
