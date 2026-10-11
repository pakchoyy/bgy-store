/** @type {import('next').NextConfig} */
const supabaseHost = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname } catch { return null }
})();

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: supabaseHost ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }] : [],
  },
};

export default nextConfig;
