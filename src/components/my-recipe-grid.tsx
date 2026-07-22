'use client'

import { useState } from 'react'
import Link from 'next/link'
import { publishRecipe } from '@/app/(main)/perfil/actions'
import type { Recipe } from '@/lib/types'

function RecipeCard({ recipe, onPublish }: { recipe: Recipe; onPublish: (id: string) => void }) {
  const isPublished = recipe.status === 'published'

  return (
    <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
      {recipe.thumbnail_url ? (
        <img src={recipe.thumbnail_url} alt={recipe.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: 'var(--brown-100)' }}>
          🍴
        </div>
      )}

      {/* Title overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-white text-[10px] font-semibold line-clamp-1 leading-tight">{recipe.title}</p>
      </div>

      {/* Draft badge + publish button */}
      {!isPublished && (
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          <span className="bg-stone-900/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            Borrador
          </span>
          <button
            onClick={() => onPublish(recipe.id)}
            className="bg-amber-500/90 text-black text-[10px] font-semibold px-2 py-0.5 rounded-full text-left"
          >
            Publicar
          </button>
        </div>
      )}

      {/* Tap-target for published recipes */}
      {isPublished && (
        <Link href={`/perfil/feed?start=${recipe.id}`} className="absolute inset-0" aria-label={recipe.title} />
      )}
    </div>
  )
}

export default function MyRecipeGrid({ recipes: initial }: { recipes: Recipe[] }) {
  const [recipes, setRecipes] = useState(initial)

  if (recipes.length === 0) return null

  async function handlePublish(id: string) {
    const result = await publishRecipe(id)
    if (!result.error) {
      setRecipes(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'published' as const, published_at: new Date().toISOString() } : r)
      )
    }
  }

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide px-5 mb-3" style={{ color: 'var(--brown-500)' }}>
        Mis recetas
      </h2>
      <div className="grid grid-cols-3 gap-0.5">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} onPublish={handlePublish} />
        ))}
      </div>
    </div>
  )
}
