import './globals.css'

export const metadata = {
  title: 'Bantu Guru Yuk — Toko Digital untuk Guru SD',
  description: 'Download modul ajar, ATP, media pembelajaran, dan administrasi untuk guru SD Indonesia.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
