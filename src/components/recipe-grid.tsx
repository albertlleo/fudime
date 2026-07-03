'use client'

import Link from 'next/link'
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
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Link href={`/receta/${recipe.id}`} className="block">
      <div ref={containerRef} className="relative aspect-[9/16] bg-stone-900 overflow-hidden">
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
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5">
          <p className="text-white text-xs font-bold line-clamp-2 leading-tight">{recipe.title}</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>@{recipe.users.display_name}</p>
        </div>
        {(recipe.likes_count ?? 0) > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <svg viewBox="0 0 24 24" fill="#ff2d55" className="w-3 h-3">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <span className="text-white text-[10px] font-bold">
              {(recipe.likes_count ?? 0) >= 1000
                ? ((recipe.likes_count ?? 0) / 1000).toFixed(1).replace('.0', '') + 'K'
                : recipe.likes_count}
            </span>
          </div>
        )}
      </div>
    </Link>
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
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--brown-900)' }}>{emptyTitle}</h2>
        <p className="text-sm" style={{ color: 'var(--brown-500)' }}>{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-0.5">
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
