'use client'

import { useState, useRef, useEffect } from 'react'
import { deleteRecipe, publishRecipe } from '@/app/(main)/perfil/actions'
import type { Recipe } from '@/lib/types'

function VideoCard({
  recipe,
  onDelete,
  onPublish,
}: {
  recipe: Recipe
  onDelete: (id: string) => void
  onPublish: (id: string) => void
}) {
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
    <div ref={containerRef} className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
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

      {/* Info overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{recipe.title}</p>
      </div>

      {/* Draft badge + publish button */}
      {recipe.status === 'draft' && (
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <div className="bg-stone-900/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            Borrador
          </div>
          <button
            onClick={() => onPublish(recipe.id)}
            className="bg-amber-500/90 hover:bg-amber-500 text-black text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors"
          >
            Publicar
          </button>
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={() => onDelete(recipe.id)}
        className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
        aria-label="Eliminar receta"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </div>
  )
}

export default function MyRecipeGrid({ recipes: initial }: { recipes: Recipe[] }) {
  const [recipes, setRecipes] = useState(initial)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  if (recipes.length === 0) return null

  async function handleDelete(id: string) {
    setDeleting(id)
    const result = await deleteRecipe(id)
    if (!result.error) {
      setRecipes(prev => prev.filter(r => r.id !== id))
    }
    setDeleting(null)
    setConfirming(null)
  }

  async function handlePublish(id: string) {
    const result = await publishRecipe(id)
    if (!result.error) {
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, status: 'published' as const, published_at: new Date().toISOString() } : r))
    }
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide px-6 mb-3">
          Mis recetas
        </h2>
        <div className="grid grid-cols-3 gap-0.5">
          {recipes.map((recipe) => (
            <VideoCard key={recipe.id} recipe={recipe} onDelete={setConfirming} onPublish={handlePublish} />
          ))}
        </div>
      </div>

      {/* Confirmation modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-stone-900 font-semibold text-base mb-2">¿Eliminar receta?</h3>
            <p className="text-stone-500 text-sm mb-6">
              Se eliminará el vídeo y todos sus datos. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(null)}
                disabled={!!deleting}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl py-2.5 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirming)}
                disabled={!!deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-xl py-2.5 text-sm transition-colors"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
