'use client'

import { useRef, useEffect } from 'react'
import type { RecipeWithCreator } from '@/lib/types'

function RecipeCard({ recipe }: { recipe: RecipeWithCreator }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = containerRef.current
    const video = videoRef.current
    if (!el || !video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="relative aspect-[9/16] bg-stone-100 overflow-hidden">
      <video
        ref={videoRef}
        src={recipe.video_url}
        poster={recipe.thumbnail_url ?? undefined}
        muted
        loop
        playsInline
        preload="none"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{recipe.title}</p>
        <p className="text-stone-400 text-[10px] mt-0.5">@{recipe.users.display_name}</p>
      </div>
    </div>
  )
}

interface RecipeGridProps {
  recipes: RecipeWithCreator[]
  emptyIcon: string
  emptyTitle: string
  emptyText: string
}

export default function RecipeGrid({ recipes, emptyIcon, emptyTitle, emptyText }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-8 py-20">
        <span className="text-5xl mb-4">{emptyIcon}</span>
        <h2 className="text-lg font-bold text-stone-900 mb-2">{emptyTitle}</h2>
        <p className="text-stone-500 text-sm">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-0.5">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
