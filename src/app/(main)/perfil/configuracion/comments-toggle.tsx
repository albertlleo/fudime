'use client'

import { useState, useTransition } from 'react'
import { toggleCommentsEnabled } from './actions'

export default function CommentsToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      const result = await toggleCommentsEnabled(next)
      if (result.error) setEnabled(!next)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
      style={{
        background: enabled ? 'var(--amber)' : '#d4c9be',
        opacity: isPending ? 0.6 : 1,
        transition: 'background 0.2s',
      }}
      aria-pressed={enabled}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full shadow-sm"
        style={{
          background: '#fff',
          transform: enabled ? 'translateX(21px)' : 'translateX(2px)',
          transition: 'transform 0.2s',
        }}
      />
    </button>
  )
}
