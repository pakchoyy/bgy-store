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
