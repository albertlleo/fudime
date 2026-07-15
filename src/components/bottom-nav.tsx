'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/',
    label: 'Inicio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    iconFilled: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" fill="white" opacity="0.3" />
      </svg>
    ),
  },
  {
    href: '/chefs',
    label: 'Buscar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    iconFilled: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    href: '/subir',
    label: 'Subir',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
    iconFilled: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M12 8v8M8 12h8" stroke="white" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/guardados',
    label: 'Guardados',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
      </svg>
    ),
    iconFilled: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
      </svg>
    ),
  },
  {
    href: '/perfil',
    label: 'Perfil',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    iconFilled: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

export default function BottomNav({ notifCount = 0 }: { notifCount?: number }) {
  const pathname = usePathname()

  const items = tabs.map(tab => ({
    ...tab,
    active: pathname === tab.href,
  }))

  return (
    <>
      {/* ── Mobile: bottom bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
        style={{
          background: 'rgba(250,247,242,0.92)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--brown-100)',
        }}>
        <div className="flex items-center justify-around h-16">
          {items.map(({ href, label, icon, iconFilled, active }) => (
            <Link key={href} href={href}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 transition-colors"
              style={{ color: active ? 'var(--amber)' : 'var(--brown-300)' }}>
              {active ? iconFilled : icon}
              <span className="text-[10px] font-semibold leading-none"
                style={{ color: active ? 'var(--brown-700)' : 'var(--brown-300)' }}>
                {label}
              </span>
              {href === '/perfil' && notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#dc2626' }} />
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── Desktop: left sidebar (Instagram-style) ── */}
      <nav className="hidden lg:flex fixed top-0 left-0 bottom-0 z-50 w-[72px] flex-col"
        style={{
          background: 'rgba(250,247,242,0.97)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid var(--brown-100)',
        }}>

        {/* FUDIME logo mark */}
        <div className="flex h-[60px] items-center justify-center flex-shrink-0"
          style={{ borderBottom: '1px solid var(--brown-100)' }}>
          <span className="text-lg font-black" style={{ color: 'var(--brown-900)', letterSpacing: '-1px' }}>F</span>
        </div>

        {/* Nav icons — centered vertically */}
        <div className="flex flex-col flex-1 items-center justify-center gap-1">
          {items.map(({ href, label, icon, iconFilled, active }) => (
            <Link key={href} href={href}
              title={label}
              className="relative w-12 h-12 flex items-center justify-center rounded-xl transition-all"
              style={{
                color: active ? 'var(--amber)' : 'var(--brown-500)',
                background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
              }}>
              {active ? iconFilled : icon}
              {href === '/perfil' && notifCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: '#dc2626' }} />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
