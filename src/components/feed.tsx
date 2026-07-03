'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { toggleLike, toggleSave, fetchMoreRecipes, fetchTrendingRecipes, fetchFollowingRecipes } from '@/app/(main)/actions'
import { PAGE_SIZE } from '@/app/(main)/constants'
import CommentSheet from '@/components/comment-sheet'
import type { RecipeWithCreator } from '@/lib/types'

interface FeedProps {
  recipes: RecipeWithCreator[]
  likedIds: string[]
  savedIds: string[]
  likeCountMap: Record<string, number>
  commentCountMap: Record<string, number>
  userId: string | null
}

export default function Feed({ recipes: initialRecipes, likedIds, savedIds, likeCountMap, commentCountMap, userId }: FeedProps) {
  const [mode, setMode] = useState<'recent' | 'trending' | 'following'>('recent')
  const [switching, setSwitching] = useState(false)
  const [recipes, setRecipes] = useState(initialRecipes)
  const [liked, setLiked] = useState(() => new Set(likedIds))
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(() => ({ ...commentCountMap }))
  const [commentRecipeId, setCommentRecipeId] = useState<string | null>(null)
  const [saved, setSaved] = useState(() => new Set(savedIds))
  const [counts, setCounts] = useState<Record<string, number>>(() => ({ ...likeCountMap }))
  const [muted, setMuted] = useState(true)
  const [hasMore, setHasMore] = useState(initialRecipes.length === PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const cursorRef = useRef<string | null>(initialRecipes.at(-1)?.published_at ?? null)

  async function switchMode(newMode: 'recent' | 'trending' | 'following') {
    if (newMode === mode || switching) return
    setSwitching(true)
    if (newMode === 'trending') {
      const result = await fetchTrendingRecipes()
      setRecipes(result.recipes)
      setLiked(new Set(result.likedIds))
      setSaved(new Set(result.savedIds))
      setCounts(result.likeCountMap)
      setHasMore(false)
    } else if (newMode === 'following') {
      const result = await fetchFollowingRecipes()
      setRecipes(result.recipes)
      setLiked(new Set(result.likedIds))
      setSaved(new Set(result.savedIds))
      setCounts(result.likeCountMap)
      setHasMore(false)
    } else {
      setRecipes(initialRecipes)
      setLiked(new Set(likedIds))
      setSaved(new Set(savedIds))
      setCounts({ ...likeCountMap })
      setHasMore(initialRecipes.length === PAGE_SIZE)
      cursorRef.current = initialRecipes.at(-1)?.published_at ?? null
    }
    setMode(newMode)
    setSwitching(false)
  }

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return
    const sentinel = sentinelRef.current

    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || loadingRef.current || !cursorRef.current) return
      loadingRef.current = true
      setLoadingMore(true)

      const result = await fetchMoreRecipes(cursorRef.current)

      if (result.recipes.length > 0) {
        setRecipes(prev => [...prev, ...result.recipes])
        setLiked(prev => new Set([...prev, ...result.likedIds]))
        setSaved(prev => new Set([...prev, ...result.savedIds]))
        setCounts(prev => ({ ...prev, ...result.likeCountMap }))
        cursorRef.current = result.recipes.at(-1)?.published_at ?? null
      }
      if (result.recipes.length < PAGE_SIZE) setHasMore(false)

      loadingRef.current = false
      setLoadingMore(false)
    }, { threshold: 0.1 })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore])

  const emptyContent = recipes.length === 0 ? (
    mode === 'following' ? (
      <div className="h-dvh snap-start snap-always flex flex-col items-center justify-center text-center px-8 pb-16 bg-stone-950">
        <span className="text-5xl mb-4">👨‍🍳</span>
        <h2 className="text-xl font-bold text-white mb-2">Aún no sigues a nadie</h2>
        <p className="text-stone-400 text-sm mb-6">Sigue a creadores para ver sus recetas aquí</p>
        <button onClick={() => switchMode('recent')} className="px-5 py-2.5 bg-amber-500 text-black font-semibold rounded-xl text-sm">
          Ver recetas
        </button>
      </div>
    ) : (
      <div className="h-dvh snap-start snap-always flex flex-col items-center justify-center text-center px-8 pb-16 bg-stone-950">
        <span className="text-5xl mb-4">🍳</span>
        <h2 className="text-xl font-bold text-white mb-2">El feed está vacío</h2>
        <p className="text-stone-400 text-sm">Pronto habrá recetas aquí.</p>
      </div>
    )
  ) : null

  return (
    <div className="relative h-dvh">
      {/* Mode tabs */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex bg-black/40 backdrop-blur-sm rounded-full p-0.5 gap-0.5">
        {([['recent', 'Para ti'], ['following', 'Siguiendo'], ['trending', '🔥']] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m ? 'bg-white text-stone-900' : 'text-white/80 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Switching overlay */}
      {switching && (
        <div className="absolute inset-0 z-20 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-stone-600 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}

    <CommentSheet
      recipeId={commentRecipeId}
      userId={userId || null}
      onClose={() => setCommentRecipeId(null)}
      onCountChange={(recipeId, delta) =>
        setCommentCounts(prev => ({ ...prev, [recipeId]: Math.max(0, (prev[recipeId] ?? 0) + delta) }))
      }
    />

    <div className="h-dvh overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
      {emptyContent}
      {recipes.map((recipe) => (
        <VideoCard
          key={recipe.id}
          recipe={recipe}
          isLiked={liked.has(recipe.id)}
          isSaved={saved.has(recipe.id)}
          likeCount={counts[recipe.id] ?? 0}
          muted={muted}
          onToggleMute={() => setMuted(v => !v)}
          commentCount={commentCounts[recipe.id] ?? 0}
          onComment={() => setCommentRecipeId(recipe.id)}
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

      {/* Sentinel / end of feed */}
      {mode === 'recent' ? (
        <div ref={sentinelRef} className="h-dvh snap-start snap-always flex items-center justify-center bg-stone-950">
          {loadingMore ? (
            <div className="flex flex-col items-center gap-3 text-stone-500">
              <div className="w-6 h-6 border-2 border-stone-600 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-xs">Cargando más recetas</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-stone-600">
              <span className="text-3xl">🍳</span>
              <p className="text-sm">Has visto todo por ahora</p>
            </div>
          )}
        </div>
      ) : (
        <div className="h-dvh snap-start snap-always flex items-center justify-center bg-stone-950">
          <div className="flex flex-col items-center gap-2 text-stone-600">
            <span className="text-3xl">🔥</span>
            <p className="text-sm">Fin de tendencias</p>
          </div>
        </div>
      )}
    </div>
  </div>
  )
}

interface VideoCardProps {
  recipe: RecipeWithCreator
  isLiked: boolean
  isSaved: boolean
  likeCount: number
  commentCount: number
  muted: boolean
  onToggleMute: () => void
  onComment: () => void
  onLike: () => void
  onSave: () => void
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K'
  return String(n)
}

function VideoCard({ recipe, isLiked, isSaved, likeCount, commentCount, muted, onToggleMute, onComment, onLike, onSave }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef<number>(0)
  const [descExpanded, setDescExpanded] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const [likeAnim, setLikeAnim] = useState(false)
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ x: number; y: number; key: number } | null>(null)

  function handleLike() {
    if (!isLiked) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 400) }
    onLike()
  }

  function handleVideoTap(e: React.MouseEvent<HTMLDivElement>) {
    const now = Date.now()
    const delta = now - lastTapRef.current
    if (delta < 300 && delta > 0) {
      // Double tap
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setDoubleTapHeart({ x, y, key: now })
      if (!isLiked) {
        setLikeAnim(true)
        setTimeout(() => setLikeAnim(false), 400)
        onLike()
      }
      setTimeout(() => setDoubleTapHeart(null), 900)
    }
    lastTapRef.current = now
  }

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
    <div ref={containerRef} className="h-dvh snap-start snap-always relative flex-shrink-0 bg-stone-950"
      onClick={handleVideoTap}>
      <video
        ref={videoRef}
        src={recipe.video_url}
        poster={recipe.thumbnail_url ?? undefined}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted
        playsInline
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Double-tap heart */}
      {doubleTapHeart && (
        <div
          key={doubleTapHeart.key}
          className="pointer-events-none absolute z-20"
          style={{
            left: doubleTapHeart.x - 48,
            top: doubleTapHeart.y - 48,
            animation: 'dtHeart 0.85s ease-out forwards',
          }}
        >
          <svg viewBox="0 0 24 24" fill="#ff2d55" className="w-24 h-24 drop-shadow-2xl">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-20 left-0 right-16 px-4 pb-2" onClick={e => e.stopPropagation()}>
        <p className="text-white font-semibold text-base leading-snug mb-1">{recipe.title}</p>
        <a href={`/creador/${creator.id}`} className="text-stone-300 text-sm font-medium hover:text-white transition-colors">
          @{creator.display_name}
        </a>
        {hasDesc && (
          <button onClick={() => setDescExpanded(v => !v)} className="text-left mt-1 w-full">
            <p className={`text-stone-400 text-xs leading-relaxed ${descExpanded ? '' : 'line-clamp-2'}`}>
              {recipe.description}
            </p>
            {!descExpanded && <span className="text-stone-500 text-xs">ver más</span>}
          </button>
        )}
      </div>

      {/* Right actions — TikTok style */}
      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1.5 active:opacity-80">
          <div className={`transition-transform duration-200 ${likeAnim ? 'scale-[1.4]' : 'scale-100'}`}>
            <svg viewBox="0 0 24 24" fill={isLiked ? '#ff2d55' : 'none'} stroke={isLiked ? '#ff2d55' : 'white'}
              strokeWidth={isLiked ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round"
              className="w-9 h-9 drop-shadow-lg">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            {fmtCount(likeCount)}
          </span>
        </button>

        {/* Comment */}
        <button onClick={onComment} className="flex flex-col items-center gap-1.5 active:opacity-80">
          <svg viewBox="0 0 24 24" fill="white" className="w-9 h-9 drop-shadow-lg">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="text-white text-xs font-bold drop-shadow-md" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            {fmtCount(commentCount)}
          </span>
        </button>

        {/* Save */}
        <button onClick={onSave} className="flex flex-col items-center gap-1.5 active:opacity-80">
          <svg viewBox="0 0 24 24" fill={isSaved ? '#f59e0b' : 'white'} className="w-9 h-9 drop-shadow-lg">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
          </svg>
          <span className="text-white text-xs font-bold drop-shadow-md" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            {isSaved ? 'Guardado' : 'Guardar'}
          </span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1.5 active:opacity-80">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
            className="w-9 h-9 drop-shadow-lg">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
          </svg>
          <span className="text-white text-xs font-bold drop-shadow-md" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            Compartir
          </span>
        </button>
      </div>

      {/* Mute button */}
      <button
        onClick={onToggleMute}
        className="absolute top-12 right-3 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors"
        aria-label={muted ? 'Activar sonido' : 'Silenciar'}
      >
        {muted ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 010 7.07" /><path d="M19.07 4.93a10 10 0 010 14.14" />
          </svg>
        )}
      </button>

      {shareToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs px-4 py-2 rounded-full shadow-lg">
          Enlace copiado
        </div>
      )}
    </div>
  )
}
