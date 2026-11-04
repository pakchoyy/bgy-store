// Rahasia HMAC untuk link klaim {order}/{sig}, dipilih menurut domain tujuan link.
// Tiap aplikasi punya rahasia sendiri agar satu kebocoran tidak berdampak ke aplikasi lain.
const RULES = [
  { pattern: /^https:\/\/(www\.)?bantuguruyuk\.web\.id\//i, env: 'KLAIM_HMAC_SECRET_BGY' },
  { pattern: /^https:\/\/(www\.)?wkelas\.web\.id\//i, env: 'KLAIM_HMAC_SECRET_WKELAS' },
]

export function claimSecretFor(fileUrl, env = process.env) {
  const rule = RULES.find(r => r.pattern.test(String(fileUrl || '')))
  return (rule && env[rule.env]) || env.KLAIM_HMAC_SECRET || null
}
