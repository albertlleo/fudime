'use client'

import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [show, setShow] = useState<'ios' | 'android' | null>(null)

  useEffect(() => {
    if (localStorage.getItem('fudime_install_dismissed')) return

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isAndroid = /android/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true

    if (isStandalone) return

    if (isIOS) {
      setTimeout(() => setShow('ios'), 3000)
    } else if (isAndroid) {
      const handler = (e: Event) => {
        e.preventDefault()
        ;(window as any)._installPrompt = e
        setShow('android')
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  function dismiss() {
    localStorage.setItem('fudime_install_dismissed', '1')
    setShow(null)
  }

  async function install() {
    const prompt = (window as any)._installPrompt
    if (prompt) {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') dismiss()
    }
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-stone-900 text-white rounded-2xl p-4 shadow-xl flex items-start gap-3">
      <img src="/logo_fudime.png" alt="FUDIME" className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Añadir FUDIME al inicio</p>
        {show === 'ios' ? (
          <p className="text-stone-400 text-xs mt-0.5">
            Pulsa <span className="text-white">⬆ Compartir</span> → "Añadir a pantalla de inicio"
          </p>
        ) : (
          <p className="text-stone-400 text-xs mt-0.5">Accede más rápido desde tu móvil</p>
        )}
        {show === 'android' && (
          <button onClick={install} className="mt-2 px-3 py-1.5 bg-amber-500 text-black text-xs font-semibold rounded-lg">
            Instalar
          </button>
        )}
      </div>
      <button onClick={dismiss} className="text-stone-500 hover:text-white flex-shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
