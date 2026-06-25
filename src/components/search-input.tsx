'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'

export default function SearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(defaultValue)

  function handleChange(v: string) {
    setValue(v)
    startTransition(() => {
      router.push(v.trim() ? `/buscar?q=${encodeURIComponent(v.trim())}` : '/buscar')
    })
  }

  return (
    <div className="relative">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        autoFocus
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar recetas..."
        className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
      />
    </div>
  )
}
