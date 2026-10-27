import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import './globals.css'

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
})

export const metadata: Metadata = {
  title: 'منصة التداول',
  description: 'تداول العملات والمؤشرات والأسهم والعملات الرقمية بأسعار مباشرة وسوق OTC',
}

export const viewport: Viewport = {
  themeColor: '#121214',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={arabic.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
