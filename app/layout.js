import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bgy-store.vercel.app'
const siteDescription = 'Download modul ajar, ATP, media pembelajaran, tools guru, dan administrasi untuk guru dan pendidik.'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Bantu Guru Yuk — Toko Digital untuk Guru SD',
  description: siteDescription,
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Bantu Guru Yuk',
    title: 'Bantu Guru Yuk — Toko Digital untuk Guru SD',
    description: siteDescription,
  },
  twitter: { card: 'summary_large_image' },
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
