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
        className="flex items-center justify-center active:opacity-60 transition-opacity"
        aria-label="Volver"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"
          style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.7))' }}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={handleBack}
      className="flex items-center justify-center active:opacity-60 transition-opacity"
      aria-label="Volver"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round"
        className="w-7 h-7" style={{ color: 'var(--brown-700)' }}>
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}
