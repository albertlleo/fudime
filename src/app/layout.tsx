import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FUDIME',
  description: 'Recetas en vídeo que usarás de verdad',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FUDIME',
  },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: '/icon-192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-amber-50 text-stone-900">{children}</body>
    </html>
  )
}
