/** @type {import('next').NextConfig} */
const supabaseHost = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname } catch { return null }
})();

const siteHost = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kreacy.my.id').hostname } catch { return 'kreacy.my.id' }
})();

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: supabaseHost ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }] : [],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Halaman admin dan API tidak boleh disimpan di cache mana pun.
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/login', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
      // Service worker harus selalu diperiksa ulang supaya update PWA cepat sampai.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
      // Ikon & aset statis jarang berubah.
      { source: '/:file(favicon.ico|icon.png|apple-icon.jpg)', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
    ];
  },
  async redirects() {
    // Domain lama (*.vercel.app) dialihkan ke domain utama. API dikecualikan supaya webhook tidak terganggu.
    return [
      {
        source: '/:path((?!api/).*)',
        has: [{ type: 'host', value: 'bgy-store.vercel.app' }],
        destination: `https://${siteHost}/:path`,
        permanent: true,
      },
      {
        source: '/:path((?!api/).*)',
        has: [{ type: 'host', value: `www.${siteHost}` }],
        destination: `https://${siteHost}/:path`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
