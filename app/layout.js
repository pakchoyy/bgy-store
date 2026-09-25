import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata = {
  title: 'Bantu Guru Yuk — Toko Digital untuk Guru SD',
  description: 'Download modul ajar, ATP, media pembelajaran, dan administrasi untuk guru SD Indonesia.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={outfit.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
