'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toggleLike, toggleSave } from '@/app/(main)/actions'
import CommentSheet from '@/components/comment-sheet'
import type { RecipeWithCreator } from '@/lib/types'

function fmtCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K'
  return String(n)
}

interface SlideProps {
  recipe: RecipeWithCreator
  isLiked: boolean
  isSaved: boolean
  likeCount: number
  commentCount: number
  muted: boolean
  isOwner: boolean
  onToggleMute: () => void
  onComment: () => void
  onLike: () => void
  onSave: () => void
}

function Slide({ recipe, isLiked, isSaved, likeCount, commentCount, muted, isOwner, onToggleMute, onComment, onLike, onSave }: SlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef<number>(0)
  const [showIngredients, setShowIngredients] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const [likeAnim, setLikeAnim] = useState(false)
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ x: number; y: number; key: number } | null>(null)

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
      setShowIngredients(false)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(handleVisibility, { threshold: 0.7 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleVisibility])

  function handleLike() {
    if (!isLiked) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 400) }
    onLike()
  }

  function handleVideoTap(e: React.MouseEvent<HTMLDivElement>) {
    const now = Date.now()
    const delta = now - lastTapRef.current
    if (delta < 300 && delta > 0) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setDoubleTapHeart({ x: e.clientX - rect.left, y: e.clientY - rect.top, key: now })
      if (!isLiked) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 400); onLike() }
      setTimeout(() => setDoubleTapHeart(null), 900)
    }
    lastTapRef.current = now
  }

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

  return (
    <div ref={containerRef} className="h-dvh snap-start snap-always relative flex-shrink-0 overflow-hidden"
      style={{ background: '#111' }} onClick={handleVideoTap}>
      {recipe.thumbnail_url && (
        <img src={recipe.thumbnail_url} alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(24px)', transform: 'scale(1.15)', opacity: 0.6 }} />
      )}
      <video
        ref={videoRef}
        src={recipe.video_url}
        poster={recipe.thumbnail_url ?? undefined}
        className="absolute inset-0 w-full h-full object-cover"
        loop muted playsInline
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {doubleTapHeart && (
        <div key={doubleTapHeart.key} className="pointer-events-none absolute z-20"
          style={{ left: doubleTapHeart.x - 48, top: doubleTapHeart.y - 48, animation: 'dtHeart 0.85s ease-out forwards' }}>
          <svg viewBox="0 0 24 24" fill="#ff2d55" className="w-24 h-24 drop-shadow-2xl">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
      )}

      {/* Share toast */}
      {shareToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full text-white text-sm font-medium"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          Enlace copiado
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-20 left-0 right-16 px-4 pb-2" onClick={e => e.stopPropagation()}>
        <a href={`/creador/${creator.id}`} className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity mb-1">
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-white/30" />
          ) : (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-black flex-shrink-0 border border-white/30"
              style={{ background: 'var(--amber)' }}>
              {creator.display_name[0].toUpperCase()}
            </div>
          )}
          <span className="text-stone-300 text-sm font-medium">@{creator.display_name}</span>
        </a>
        <p className="text-white font-semibold text-base leading-snug mb-2">{recipe.title}</p>
        {recipe.description && (
          <button onClick={() => setShowIngredients(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-medium active:opacity-70 transition-opacity">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            INGREDIENTES Y PASO A PASO
          </button>
        )}
      </div>

      {/* Ingredients bottom sheet */}
      <div className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.5)', opacity: showIngredients ? 1 : 0, pointerEvents: showIngredients ? 'auto' : 'none' }}
        onClick={() => setShowIngredients(false)} />
      <div className="fixed inset-0 z-[70] pointer-events-none">
        <div className="h-full lg:pl-[72px] lg:flex lg:justify-center">
          <div className="w-full lg:max-w-[500px] h-full relative">
            <div className="absolute left-0 right-0 bottom-0 flex flex-col pointer-events-auto transition-transform duration-300 ease-out"
              style={{ height: '70dvh', borderRadius: '20px 20px 0 0', background: 'var(--cream)', transform: showIngredients ? 'translateY(0)' : 'translateY(100%)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--brown-300)' }} />
              </div>
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--brown-100)' }}>
                <h3 className="font-black text-base" style={{ color: 'var(--brown-900)' }}>INGREDIENTES Y PASO A PASO</h3>
                <button onClick={() => setShowIngredients(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--brown-100)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" style={{ color: 'var(--brown-500)' }}>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4" style={{ overscrollBehavior: 'contain' }}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--brown-900)' }}>{recipe.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Options sheet (owner only) */}
      {isOwner && (
        <>
          <div className="fixed inset-0 z-[60] transition-opacity duration-300"
            style={{ background: 'rgba(0,0,0,0.45)', opacity: showOptions ? 1 : 0, pointerEvents: showOptions ? 'auto' : 'none' }}
            onClick={() => setShowOptions(false)} />
          <div className="fixed inset-0 z-[70] pointer-events-none">
            <div className="h-full lg:pl-[72px] lg:flex lg:justify-center">
              <div className="w-full lg:max-w-[500px] h-full relative">
                <div className="absolute left-0 right-0 bottom-0 pointer-events-auto transition-transform duration-300 ease-out"
                  style={{ borderRadius: '20px 20px 0 0', background: '#fff', transform: showOptions ? 'translateY(0)' : 'translateY(100%)' }}
                  onClick={e => e.stopPropagation()}>
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full" style={{ background: 'var(--brown-200)' }} />
                  </div>
                  <Link href={`/receta/${recipe.id}/editar`}
                    className="flex items-center gap-3.5 px-5 py-4 active:opacity-70 transition-opacity"
                    style={{ borderTop: '1px solid var(--brown-100)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                      className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--brown-700)' }}>
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span className="text-base font-medium" style={{ color: 'var(--brown-900)' }}>Editar publicación</span>
                  </Link>
                  <button onClick={() => setShowOptions(false)}
                    className="w-full flex items-center justify-center py-4 text-sm font-medium"
                    style={{ borderTop: '1px solid var(--brown-100)', color: 'var(--brown-400)', marginBottom: 'env(safe-area-inset-bottom)' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Right actions */}
      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
        {isOwner && (
          <button onClick={() => setShowOptions(true)} className="flex flex-col items-center gap-1 active:opacity-80">
            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 drop-shadow-lg">
              <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        )}

        <button onClick={handleLike} className="flex flex-col items-center gap-1.5 active:opacity-80">
          <div className={`transition-transform duration-200 ${likeAnim ? 'scale-[1.4]' : 'scale-100'}`}>
            <svg viewBox="0 0 24 24" fill={isLiked ? '#ff2d55' : 'white'} stroke="none" className="w-7 h-7 drop-shadow-lg">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{fmtCount(likeCount)}</span>
        </button>

        <button onClick={onComment} className="flex flex-col items-center gap-1.5 active:opacity-80">
          <svg viewBox="0 0 24 24" fill="white" stroke="none" className="w-7 h-7 drop-shadow-lg">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="text-white text-xs font-bold drop-shadow-md" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{fmtCount(commentCount)}</span>
        </button>

        <button onClick={onSave} className="flex flex-col items-center gap-1.5 active:opacity-80">
          <svg viewBox="0 0 24 24" fill={isSaved ? '#f59e0b' : 'white'} stroke="none" className="w-7 h-7 drop-shadow-lg">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
          </svg>
          <span className="text-white text-xs font-bold drop-shadow-md" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{isSaved ? 'Guardado' : 'Guardar'}</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1.5 active:opacity-80">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 drop-shadow-lg">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
          </svg>
          <span className="text-white text-xs font-bold drop-shadow-md" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>Compartir</span>
        </button>
      </div>

      {/* Mute button */}
      <button onClick={onToggleMute}
        className="absolute top-12 right-3 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center"
        aria-label={muted ? 'Activar sonido' : 'Silenciar'}>
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
    </div>
  )
}

interface CreatorFeedProps {
  recipes: RecipeWithCreator[]
  likedIds: string[]
  savedIds: string[]
  likeCountMap: Record<string, number>
  commentCountMap: Record<string, number>
  userId: string | null
}

export default function CreatorFeed({ recipes: initialRecipes, likedIds, savedIds, likeCountMap, commentCountMap, userId }: CreatorFeedProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(() => new Set(likedIds))
  const [saved, setSaved] = useState(() => new Set(savedIds))
  const [counts, setCounts] = useState<Record<string, number>>(() => ({ ...likeCountMap }))
  const [commentCounts] = useState<Record<string, number>>(() => ({ ...commentCountMap }))
  const [muted, setMuted] = useState(true)
  const [commentRecipeId, setCommentRecipeId] = useState<string | null>(null)

  function handleBack() {
    if (window.history.length > 1) router.back()
    else router.push('/')
  }

  return (
    <div className="relative h-dvh">
      {/* Back button — fixed overlay, always visible */}
      <button onClick={handleBack}
        className="fixed top-12 left-4 z-40 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        aria-label="Volver">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </button>

      <CommentSheet
        recipeId={commentRecipeId}
        userId={userId}
        onClose={() => setCommentRecipeId(null)}
        onCountChange={() => {}}
      />

      <div className="h-dvh overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {initialRecipes.map(recipe => (
          <Slide
            key={recipe.id}
            recipe={recipe}
            isLiked={liked.has(recipe.id)}
            isSaved={saved.has(recipe.id)}
            likeCount={counts[recipe.id] ?? 0}
            commentCount={commentCounts[recipe.id] ?? 0}
            muted={muted}
            isOwner={!!userId && userId === recipe.users.id}
            onToggleMute={() => setMuted(v => !v)}
            onComment={() => setCommentRecipeId(recipe.id)}
            onLike={() => {
              const wasLiked = liked.has(recipe.id)
              setLiked(prev => { const n = new Set(prev); wasLiked ? n.delete(recipe.id) : n.add(recipe.id); return n })
              setCounts(prev => ({ ...prev, [recipe.id]: (prev[recipe.id] ?? 0) + (wasLiked ? -1 : 1) }))
              toggleLike(recipe.id)
            }}
            onSave={() => {
              setSaved(prev => { const n = new Set(prev); n.has(recipe.id) ? n.delete(recipe.id) : n.add(recipe.id); return n })
              toggleSave(recipe.id)
            }}
          />
        ))}

        {/* End card */}
        <div className="h-dvh snap-start snap-always flex flex-col items-center justify-center text-center px-8 bg-stone-950">
          <span className="text-4xl mb-3">👨‍🍳</span>
          <p className="text-white font-semibold">Has visto todas las recetas</p>
          <button onClick={handleBack} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-black" style={{ background: 'var(--amber)' }}>
            Volver al perfil
          </button>
        </div>
      </div>
    </div>
  )
}
