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
      { src: '/logo-bgy.jpg', sizes: 'any', type: 'image/jpeg', purpose: 'any' },
      { src: '/logo-bgy.jpg', sizes: 'any', type: 'image/jpeg', purpose: 'maskable' },
    ],
  }
}
