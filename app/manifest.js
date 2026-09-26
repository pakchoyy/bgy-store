export default function manifest() {
  return {
    name: 'Bantu Guru Yuk',
    short_name: 'Bantu Guru Yuk',
    description: 'Bahan ajar, tools guru, dan administrasi kelas siap pakai.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f0fdfa',
    theme_color: '#123b35',
    lang: 'id',
    icons: [
      { src: '/pwa-icon?size=192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon?size=512&maskable=1', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
