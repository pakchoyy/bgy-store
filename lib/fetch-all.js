// Supabase mengirim paling banyak 1000 baris per permintaan; ambil bertahap sampai habis.
// query: fungsi yang membuat query baru (wajib ada .order agar halaman stabil).
export async function fetchAll(query, max = 100000) {
  const rows = []
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await query().range(from, from + 999)
    if (error) return { data: rows.length ? rows : null, error }
    rows.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return { data: rows, error: null }
}
