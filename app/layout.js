import { Outfit } from 'next/font/google'
import './globals.css'
import { SITE_URL } from '@/lib/site'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
})

const siteUrl = SITE_URL
const siteDescription = 'Download modul ajar, ATP, media pembelajaran, tools guru, dan administrasi untuk guru dan pendidik.'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Kreacy — Teman Praktis Guru dan Pendidik',
  description: siteDescription,
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Kreacy',
    title: 'Kreacy — Teman Praktis Guru dan Pendidik',
    description: siteDescription,
  },
  twitter: { card: 'summary_large_image' },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } } : {}),
  appleWebApp: { capable: true, title: 'Kreacy', statusBarStyle: 'default' },
}

export const viewport = {
  themeColor: '#123b35',
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
