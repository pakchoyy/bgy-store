export default function manifest() {
  return {
    name: 'Kreacy',
    short_name: 'Kreacy',
    description: 'Bahan ajar, tools guru, dan administrasi kelas siap pakai.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f0fdfa',
    theme_color: '#123b35',
    lang: 'id',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
