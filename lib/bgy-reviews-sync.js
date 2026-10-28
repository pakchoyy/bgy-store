// Sinkron ulasan aplikasi BGY (Supabase BGY, tabel bgy_reviews) ke produk lisensinya di toko.
// Ulasan BGY yang sudah disetujui disalin dengan source 'bgy'; yang dihapus/ditolak di BGY ikut dihapus di sini.
const BGY_URL = 'https://xtmpiqpmwirsrcsphsto.supabase.co'
// Kunci anon publik BGY (sama dengan yang dipakai halaman web BGY); bukan rahasia.
const BGY_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0bXBpcXBtd2lyc3Jjc3Boc3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTkyODMsImV4cCI6MjA5MzA3NTI4M30.yk1ZW3fxKn2lLoalJt97l34a80ERaGiVTIt09titk-w'

// Tool di BGY → produk di toko yang menampilkan ulasannya.
const TOOL_PRODUCTS = {
  soal: ['96f78f8f-9810-442f-9546-e347e40de306', '7ff6c17c-36fa-476d-86f0-a37af24afb74'],
  'modul-ajar': ['4648a877-68b1-4b2d-b737-f7a5d6c45e56', '511e2227-ad05-4b6a-be29-1bfb285e7411'],
  lkpd: ['ece8a4ce-aa3e-44f8-b3e7-8ea626294e18'],
  'draft-tp': ['cc4c5623-9197-4570-be30-f9242b5a562a'],
}

export async function syncBgyReviews(supabase) {
  const tools = Object.keys(TOOL_PRODUCTS).map(encodeURIComponent).join(',')
  const res = await fetch(`${BGY_URL}/rest/v1/bgy_reviews?select=id,tool,rating,body,name,school,created_at&approved=eq.true&tool=in.(${tools})&order=id&limit=2000`, {
    headers: { apikey: BGY_ANON, Authorization: `Bearer ${BGY_ANON}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`BGY ${res.status}`)
  const reviews = await res.json()

  const { data: existing, error } = await supabase.from('product_reviews').select('id, product_id, bgy_review_id').eq('source', 'bgy')
  if (error) throw error
  const have = new Set((existing || []).map((r) => `${r.product_id}:${r.bgy_review_id}`))

  const wanted = new Set()
  const rows = []
  for (const r of reviews) {
    const rating = Math.round(Number(r.rating))
    if (!(rating >= 1 && rating <= 5)) continue
    for (const productId of TOOL_PRODUCTS[r.tool] || []) {
      const key = `${productId}:${r.id}`
      wanted.add(key)
      if (have.has(key)) continue
      rows.push({
        product_id: productId,
        order_id: null,
        reviewer_name: (r.name || '').trim().slice(0, 80) || 'Guru pengguna BGY',
        reviewer_institution: (r.school || '').trim().slice(0, 120) || null,
        rating,
        comment: (r.body || '').trim().slice(0, 1000) || null,
        is_approved: true,
        created_at: r.created_at,
        source: 'bgy',
        bgy_review_id: r.id,
      })
    }
  }
  if (rows.length) {
    const { error: insErr } = await supabase.from('product_reviews').insert(rows)
    if (insErr) throw insErr
  }
  const stale = (existing || []).filter((r) => !wanted.has(`${r.product_id}:${r.bgy_review_id}`)).map((r) => r.id)
  if (stale.length) {
    const { error: delErr } = await supabase.from('product_reviews').delete().in('id', stale)
    if (delErr) throw delErr
  }
  return { added: rows.length, removed: stale.length }
}
