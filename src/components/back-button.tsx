'use client'

import { useRouter } from 'next/navigation'

interface Props {
  /** Used when there's no history to go back to */
  fallback?: string
  /** White glass variant for use over dark backgrounds */
  glass?: boolean
}

export default function BackButton({ fallback = '/', glass = false }: Props) {
  const router = useRouter()

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallback)
    }
  }

  if (glass) {
    return (
      <button
        onClick={handleBack}
        className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        aria-label="Volver"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={handleBack}
      className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-colors active:opacity-70"
      style={{ background: 'var(--brown-100)' }}
      aria-label="Volver"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
        className="w-5 h-5" style={{ color: 'var(--brown-700)' }}>
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
    </button>
  )
}
