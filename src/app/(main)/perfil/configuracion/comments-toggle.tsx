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
      aria-pressed={enabled}
      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors"
      style={{
        background: enabled ? 'var(--amber)' : '#d4c9be',
        opacity: isPending ? 0.6 : 1,
        transition: 'background 0.2s',
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
        style={{
          transform: enabled ? 'translateX(24px)' : 'translateX(4px)',
          transition: 'transform 0.2s',
        }}
      />
    </button>
  )
}
