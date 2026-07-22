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
      <input
        autoFocus
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar recetas..."
        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
      />
    </div>
  )
}
