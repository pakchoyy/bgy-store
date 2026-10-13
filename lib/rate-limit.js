const buckets = new Map()

export function clientIp(request) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown'
}

export function rateLimited(request, name, limit, windowMs) {
  const key = `${name}:${clientIp(request)}`
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k)
    }
    return false
  }
  bucket.count += 1
  return bucket.count > limit
}

export function tooMany() {
  return Response.json({ error: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.' }, { status: 429 })
}

// Rate limit bersama lewat Supabase (SQL 021) supaya berlaku di semua server Vercel.
// Jika SQL belum dijalankan / service role tidak ada, jatuh ke limiter memori di atas.
export async function rateLimitedShared(request, name, limit, windowMs) {
  const local = rateLimited(request, name, limit, windowMs)
  try {
    const { hasServiceRole, createServiceClient } = await import('@/lib/supabase-server')
    if (!hasServiceRole()) return local
    const { createHash } = await import('crypto')
    const key = `${name}:${createHash('sha256').update(clientIp(request)).digest('hex').slice(0, 32)}`
    const supabase = await createServiceClient()
    const { data, error } = await supabase.rpc('hit_rate_limit', { p_key: key, p_limit: limit, p_window_seconds: Math.round(windowMs / 1000) })
    if (error) return local
    return data === true || local
  } catch {
    return local
  }
}
