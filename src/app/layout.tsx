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
      <body style={{ background: 'var(--cream)' }}>
        <div className="lg:flex lg:min-h-dvh">

          {/* ── Left branding panel — desktop only ── */}
          <div className="hidden lg:flex flex-col justify-between flex-1 relative overflow-hidden px-14 py-12"
            style={{ background: 'var(--cream)' }}>

            {/* Decorative orbs */}
            <div className="pointer-events-none absolute" style={{
              top: '-120px', right: '-120px',
              width: '480px', height: '480px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
            }} />
            <div className="pointer-events-none absolute" style={{
              bottom: '-80px', left: '-80px',
              width: '360px', height: '360px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(194,68,14,0.08) 0%, transparent 70%)',
            }} />

            {/* Logo */}
            <div>
              <span className="text-2xl font-black tracking-tight" style={{ color: 'var(--brown-900)' }}>
                FUDIME
              </span>
            </div>

            {/* Center hero */}
            <div className="relative z-10">
              <div className="flex gap-3 mb-8">
                {['🍳', '🥑', '🍝', '🧆'].map((e, i) => (
                  <div key={i} className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    {e}
                  </div>
                ))}
              </div>
              <h2 className="text-4xl font-black leading-tight mb-4" style={{ color: 'var(--brown-900)' }}>
                Recetas en vídeo<br />
                <span style={{ color: 'var(--amber)' }}>que usarás</span><br />
                de verdad.
              </h2>
              <p className="text-base leading-relaxed" style={{ color: 'var(--brown-500)' }}>
                Descubre recetas auténticas creadas<br />
                por chefs verificados.
              </p>
            </div>

            {/* Bottom badges */}
            <div className="relative z-10 flex flex-col gap-2">
              {[
                { emoji: '✦', text: 'Chefs verificados' },
                { emoji: '▶', text: 'Formato vídeo corto' },
                { emoji: '♥', text: 'Las que realmente cocinarás' },
              ].map(({ emoji, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <span className="text-xs font-black" style={{ color: 'var(--amber)' }}>{emoji}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--brown-500)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: app content ── */}
          <div className="w-full lg:w-[430px] lg:flex-shrink-0 lg:border-l"
            style={{ borderColor: 'var(--brown-100)' }}>
            {children}
          </div>

        </div>
      </body>
    </html>
  )
}
