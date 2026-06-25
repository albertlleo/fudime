'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { toggleLike, toggleSave } from '@/app/(main)/actions'
import type { RecipeWithCreator } from '@/lib/types'

interface FeedProps {
  recipes: RecipeWithCreator[]
  likedIds: string[]
  savedIds: string[]
  likeCountMap: Record<string, number>
  userId: string
}

export default function Feed({ recipes, likedIds, savedIds, likeCountMap }: FeedProps) {
  const [liked, setLiked] = useState(() => new Set(likedIds))
  const [saved, setSaved] = useState(() => new Set(savedIds))
  const [counts, setCounts] = useState<Record<string, number>>(() => ({ ...likeCountMap }))
  const [muted, setMuted] = useState(true)

  if (recipes.length === 0) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center text-center px-8 pb-16">
        <span className="text-5xl mb-4">🍳</span>
        <h2 className="text-xl font-bold text-amber-50 mb-2">El feed está vacío</h2>
        <p className="text-stone-400 text-sm">Pronto habrá recetas aquí. ¡Sé el primero en subir una!</p>
      </div>
    )
  }

  return (
    <div className="h-dvh overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
      {recipes.map((recipe) => (
        <VideoCard
          key={recipe.id}
          recipe={recipe}
          isLiked={liked.has(recipe.id)}
          isSaved={saved.has(recipe.id)}
          likeCount={counts[recipe.id] ?? 0}
          muted={muted}
          onToggleMute={() => setMuted(v => !v)}
          onLike={() => {
            const wasLiked = liked.has(recipe.id)
            setLiked(prev => {
              const next = new Set(prev)
              wasLiked ? next.delete(recipe.id) : next.add(recipe.id)
              return next
            })
            setCounts(prev => ({
              ...prev,
              [recipe.id]: (prev[recipe.id] ?? 0) + (wasLiked ? -1 : 1),
            }))
            toggleLike(recipe.id)
          }}
          onSave={() => {
            setSaved(prev => {
              const next = new Set(prev)
              next.has(recipe.id) ? next.delete(recipe.id) : next.add(recipe.id)
              return next
            })
            toggleSave(recipe.id)
          }}
        />
      ))}
    </div>
  )
}

interface VideoCardProps {
  recipe: RecipeWithCreator
  isLiked: boolean
  isSaved: boolean
  likeCount: number
  muted: boolean
  onToggleMute: () => void
  onLike: () => void
  onSave: () => void
}

function VideoCard({ recipe, isLiked, isSaved, likeCount, muted, onToggleMute, onLike, onSave }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [descExpanded, setDescExpanded] = useState(false)
  const [shareToast, setShareToast] = useState(false)

  // React doesn't reactively update the `muted` DOM property — set it imperatively
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  const handleVisibility = useCallback((entries: IntersectionObserverEntry[]) => {
    const entry = entries[0]
    if (!videoRef.current) return
    if (entry.isIntersecting) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setDescExpanded(false)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(handleVisibility, { threshold: 0.7 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleVisibility])

  async function handleShare() {
    const url = `${window.location.origin}/receta/${recipe.id}`
    if (navigator.share) {
      await navigator.share({ title: recipe.title, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    }
  }

  const creator = recipe.users
  const hasDesc = !!recipe.description

  return (
    <div ref={containerRef} className="h-dvh snap-start snap-always relative flex-shrink-0 bg-stone-950">
      {/* Video */}
      <video
        ref={videoRef}
        src={recipe.video_url}
        poster={recipe.thumbnail_url ?? undefined}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted
        playsInline
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Bottom info */}
      <div className="absolute bottom-20 left-0 right-16 px-4 pb-2">
        <p className="text-white font-semibold text-base leading-snug mb-1">{recipe.title}</p>
        <a href={`/creador/${creator.id}`} className="text-stone-300 text-sm font-medium hover:text-white transition-colors">
          @{creator.display_name}
        </a>
        {hasDesc && (
          <button
            onClick={() => setDescExpanded(v => !v)}
            className="text-left mt-1 w-full"
          >
            <p className={`text-stone-400 text-xs leading-relaxed ${descExpanded ? '' : 'line-clamp-2'}`}>
              {recipe.description}
            </p>
            {!descExpanded && (
              <span className="text-stone-500 text-xs">ver más</span>
            )}
          </button>
        )}
      </div>

      {/* Right action buttons */}
      <div className="absolute bottom-20 right-3 flex flex-col items-center gap-5 pb-2">
        {/* Like */}
        <button
          onClick={onLike}
          className={`flex flex-col items-center gap-1 transition-transform active:scale-90 ${isLiked ? 'text-red-500' : 'text-white'}`}
        >
          <svg viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isLiked ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <span className="text-[10px] font-medium drop-shadow">
            {likeCount > 0 ? likeCount.toLocaleString() : 'Me gusta'}
          </span>
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          className={`flex flex-col items-center gap-1 transition-transform active:scale-90 ${isSaved ? 'text-amber-500' : 'text-white'}`}
        >
          <svg viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isSaved ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
          </svg>
          <span className="text-[10px] font-medium drop-shadow">Guardar</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 text-white transition-transform active:scale-90"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
          </svg>
          <span className="text-[10px] font-medium drop-shadow">Compartir</span>
        </button>
      </div>

      {/* Mute / unmute button */}
      <button
        onClick={onToggleMute}
        className="absolute top-12 right-3 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors"
        aria-label={muted ? 'Activar sonido' : 'Silenciar'}
      >
        {muted ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 010 7.07" />
            <path d="M19.07 4.93a10 10 0 010 14.14" />
          </svg>
        )}
      </button>

      {/* Share toast */}
      {shareToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs px-4 py-2 rounded-full shadow-lg">
          Enlace copiado
        </div>
      )}
    </div>
  )
}
