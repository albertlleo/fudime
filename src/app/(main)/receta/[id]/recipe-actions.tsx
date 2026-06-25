'use client'

import { useState } from 'react'
import { toggleLike, toggleSave } from '@/app/(main)/actions'

export default function RecipeActions({
  recipeId,
  isLiked: initialLiked,
  isSaved: initialSaved,
  likeCount: initialCount,
}: {
  recipeId: string
  isLiked: boolean
  isSaved: boolean
  likeCount: number
}) {
  const [liked, setLiked] = useState(initialLiked)
  const [saved, setSaved] = useState(initialSaved)
  const [count, setCount] = useState(initialCount)

  function handleLike() {
    const wasLiked = liked
    setLiked(v => !v)
    setCount(v => v + (wasLiked ? -1 : 1))
    toggleLike(recipeId)
  }

  function handleSave() {
    setSaved(v => !v)
    toggleSave(recipeId)
  }

  return (
    <div className="flex gap-3 pt-2">
      <button
        onClick={handleLike}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
          liked ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
        }`}
      >
        <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={liked ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
        {count > 0 ? count.toLocaleString() : 'Me gusta'}
      </button>

      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
          saved ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white'
        }`}
      >
        <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={saved ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
        </svg>
        {saved ? 'Guardado' : 'Guardar'}
      </button>
    </div>
  )
}
