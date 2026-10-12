// Satu sumber alamat website. Atur NEXT_PUBLIC_SITE_URL di Vercel; fallback ke domain utama.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kreacy.my.id').replace(/\/+$/, '')
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '')
