'use client'

import { useState } from 'react'

export default function ShareCreator({ name, id }: { name: string; id: string }) {
  const [toast, setToast] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/creador/${id}`
    if (navigator.share) {
      await navigator.share({ title: name, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      setToast(true)
      setTimeout(() => setToast(false), 2000)
    }
  }

  return (
    <div className="relative">
      <button onClick={handleShare} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
        </svg>
        Compartir
      </button>
      {toast && (
        <div className="absolute right-0 top-8 bg-stone-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
          Enlace copiado
        </div>
      )}
    </div>
  )
}
