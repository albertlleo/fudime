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
    <html lang="es" className={`${geist.variable} antialiased`}>
      <body>
        {/* Mobile-first: content capped at 430px (iPhone width), cream margins on desktop */}
        <div style={{ maxWidth: '430px', margin: '0 auto', minHeight: '100dvh', position: 'relative' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
