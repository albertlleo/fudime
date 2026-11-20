'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { RecipeWithCreator } from '@/lib/types'
import { DIETS } from '@/lib/categories'

function RecipeCard({ recipe, href }: { recipe: RecipeWithCreator; href: string }) {
  return (
    <Link href={href} className="block">
      <div className="relative aspect-[3/4] bg-stone-900 overflow-hidden">
        {recipe.thumbnail_url ? (
          <img src={recipe.thumbnail_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🍴</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
          <p className="text-white text-[9px] font-bold line-clamp-1 leading-tight uppercase">{recipe.title}</p>
          <p className="text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>@{recipe.users.display_name}</p>
        </div>
        {(recipe.likes_count ?? 0) > 0 && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <svg viewBox="0 0 24 24" fill="#f59e0b" className="w-2.5 h-2.5">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <span className="text-white text-[8px] font-bold">
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

interface Props {
  recipes: RecipeWithCreator[]
  feedBase?: string
  emptyIcon?: string
  emptyTitle?: string
  emptyText?: string
}

export default function RecipeSearchGrid({
  recipes,
  feedBase,
  emptyIcon = '🔖',
  emptyTitle = 'Sin recetas',
  emptyText = 'No hay recetas aquí',
}: Props) {
  const [query, setQuery] = useState('')
  const [filterDiet, setFilterDiet] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  const hasActiveFilter = !!filterDiet

  const filtered = useMemo(() => {
    let r = recipes
    if (query.trim()) {
      const q = query.toLowerCase()
      r = r.filter(recipe =>
        recipe.title.toLowerCase().includes(q) ||
        recipe.users.display_name.toLowerCase().includes(q)
      )
    }
    if (filterDiet) {
      r = r.filter(recipe => recipe.diet?.includes(filterDiet))
    }
    return r
  }, [recipes, query, filterDiet])

  return (
    <>
      {/* Search + filter row */}
      <div className="px-5 pb-4 flex gap-2">
        <div className="flex-1">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar receta..."
            className="input-cream"
          />
        </div>
        <button
          onClick={() => setShowFilter(true)}
          className="w-11 flex-shrink-0 rounded-2xl flex items-center justify-center transition-colors"
          style={{
            background: hasActiveFilter ? 'var(--amber)' : '#fff',
            border: '1.5px solid var(--brown-100)',
            color: hasActiveFilter ? '#000' : 'var(--brown-500)',
          }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-8 py-20">
          <span className="text-5xl mb-4">{emptyIcon}</span>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--brown-900)' }}>{emptyTitle}</h2>
          <p className="text-sm" style={{ color: 'var(--brown-500)' }}>{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {filtered.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              href={feedBase ? `${feedBase}?start=${recipe.id}` : `/receta/${recipe.id}`}
            />
          ))}
        </div>
      )}

      {/* Filter backdrop */}
      <div className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.45)', opacity: showFilter ? 1 : 0, pointerEvents: showFilter ? 'auto' : 'none' }}
        onClick={() => setShowFilter(false)} />

      {/* Filter sheet */}
      <div className="fixed inset-0 z-[70] pointer-events-none">
        <div className="h-full lg:pl-[72px] lg:flex lg:justify-center">
          <div className="w-full lg:max-w-[500px] h-full relative">
            <div className="absolute left-0 right-0 bottom-0 pointer-events-auto transition-transform duration-300 ease-out"
              style={{
                background: 'var(--cream)', borderRadius: '20px 20px 0 0',
                transform: showFilter ? 'translateY(0)' : 'translateY(100%)',
                paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 16px))',
              }}>
              <div className="px-5 pt-4 pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full" style={{ background: 'var(--brown-300)' }} />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-base" style={{ color: 'var(--brown-900)' }}>Filtrar</h3>
                  {hasActiveFilter && (
                    <button onClick={() => setFilterDiet('')}
                      className="text-xs font-semibold" style={{ color: 'var(--terracotta)' }}>
                      Limpiar
                    </button>
                  )}
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>
                  Dieta
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIETS.map(d => (
                    <button key={d.key}
                      onClick={() => { setFilterDiet(filterDiet === d.key ? '' : d.key); setShowFilter(false) }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-semibold transition-colors"
                      style={{
                        background: filterDiet === d.key ? 'var(--amber)' : '#fff',
                        border: '1.5px solid var(--brown-100)',
                        color: 'var(--brown-800)',
                      }}>
                      <span>{d.emoji}</span>
                      <span>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
