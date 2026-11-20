'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import BackButton from '@/components/back-button'
import VerifiedBadge from '@/components/verified-badge'
import type { RecipeWithCreator } from '@/lib/types'
import { CAT_EMOJIS, DIETS } from '@/lib/categories'

type Tab = 'todas' | 'categoria' | 'creador'

function RecipeThumb({ recipe }: { recipe: RecipeWithCreator }) {
  return (
    <Link href={`/guardados/feed?start=${recipe.id}`} className="block">
      <div className="relative aspect-[3/4] bg-stone-900 overflow-hidden">
        {recipe.thumbnail_url ? (
          <img src={recipe.thumbnail_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🍴</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
          <p className="text-white text-[9px] font-semibold line-clamp-1 leading-tight uppercase">{recipe.title}</p>
        </div>
      </div>
    </Link>
  )
}

function CategoryCard({ cat, recipes }: { cat: string; recipes: RecipeWithCreator[] }) {
  const cover = recipes[0]
  const emoji = CAT_EMOJIS[cat.toLowerCase()] ?? '🍴'
  return (
    <Link href={`/guardados/categoria/${encodeURIComponent(cat)}`} className="block">
      <div className="relative aspect-[3/4] bg-stone-900 overflow-hidden">
        {cover?.thumbnail_url ? (
          <img src={cover.thumbnail_url} alt={cat} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl"
            style={{ background: 'var(--brown-100)' }}>
            {emoji}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 pt-6 pb-2">
          <p className="text-white text-[9px] font-bold uppercase line-clamp-2 mb-0.5">{cat}</p>
          <p className="text-white/60 text-[8px]">{recipes.length} receta{recipes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </Link>
  )
}

function SavedChefRow({ id, name, avatarUrl, validatedAt, count }: {
  id: string; name: string; avatarUrl: string | null; validatedAt: string | null; count: number
}) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <Link href={`/guardados/creador/${id}`}
      className="flex items-center gap-3.5 px-5 py-3.5 active:opacity-70 transition-opacity"
      style={{ borderBottom: '1px solid var(--brown-100)' }}>
      <div className="relative flex-shrink-0">
        {avatarUrl
          ? <img src={avatarUrl} alt={name} className="w-14 h-14 rounded-full object-cover" />
          : <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-black text-black"
              style={{ background: 'var(--amber)' }}>{initials}</div>
        }
        {validatedAt && (
          <div className="absolute -bottom-0.5 -right-0.5 rounded-full"
            style={{ background: '#fff', padding: '1.5px' }}>
            <VerifiedBadge size="sm" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: 'var(--brown-900)' }}>@{name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--brown-500)' }}>
          {count} receta{count !== 1 ? 's' : ''} guardada{count !== 1 ? 's' : ''}
        </p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brown-300)' }}>
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  )
}

export default function GuardadosClient({ recipes }: { recipes: RecipeWithCreator[] }) {
  const [tab, setTab] = useState<Tab>('todas')
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

  const byCategory = useMemo(() => {
    const map: Record<string, RecipeWithCreator[]> = {}
    for (const r of filtered) {
      const tags = r.tags?.length ? r.tags : ['Sin categoría']
      for (const tag of tags) {
        if (!map[tag]) map[tag] = []
        map[tag].push(r)
      }
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length)
  }, [filtered])

  const byCreator = useMemo(() => {
    const map: Record<string, { name: string; avatarUrl: string | null; validatedAt: string | null; recipes: RecipeWithCreator[] }> = {}
    for (const r of filtered) {
      const id = r.users.id
      if (!map[id]) map[id] = { name: r.users.display_name, avatarUrl: r.users.avatar_url, validatedAt: r.users.validated_at, recipes: [] }
      map[id].recipes.push(r)
    }
    return Object.entries(map).sort((a, b) => b[1].recipes.length - a[1].recipes.length)
  }, [filtered])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'creador', label: 'Creador' },
  ]

  return (
    <div className="h-dvh overflow-y-auto pb-28" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-4">
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-4">
          <BackButton fallback="/" />
          <h1 className="text-2xl font-black" style={{ color: 'var(--brown-900)' }}>Guardados</h1>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <input type="search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar receta guardada..." className="input-cream" />
          </div>
          <button
            onClick={() => setShowFilter(true)}
            className="w-11 flex-shrink-0 rounded-2xl flex items-center justify-center relative transition-colors"
            style={{
              background: hasActiveFilter ? 'var(--amber)' : '#fff',
              border: '1.5px solid var(--brown-100)',
              color: hasActiveFilter ? '#000' : 'var(--brown-500)',
            }}>
            <FilterIcon />
            {hasActiveFilter && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
            )}
          </button>
        </div>

        {/* Tabs */}
        {recipes.length > 0 && (
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--brown-100)' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all"
                style={{
                  background: tab === t.key ? '#fff' : 'transparent',
                  color: tab === t.key ? 'var(--brown-900)' : 'var(--brown-500)',
                  boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <span className="text-5xl mb-4">🔖</span>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--brown-900)' }}>Nada guardado aún</h2>
          <p className="text-sm" style={{ color: 'var(--brown-500)' }}>Guarda recetas del feed pulsando el marcador</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-sm" style={{ color: 'var(--brown-500)' }}>
            {hasActiveFilter ? 'Sin resultados con este filtro' : `No hay recetas guardadas con "${query}"`}
          </p>
        </div>
      ) : tab === 'todas' ? (
        <div className="grid grid-cols-3 gap-0.5 px-0.5">
          {filtered.map(r => <RecipeThumb key={r.id} recipe={r} />)}
        </div>
      ) : tab === 'categoria' ? (
        <div className="grid grid-cols-3 gap-0.5 px-0.5">
          {byCategory.map(([cat, recs]) => (
            <CategoryCard key={cat} cat={cat} recipes={recs} />
          ))}
        </div>
      ) : (
        <div>
          {byCreator.map(([id, { name, avatarUrl, validatedAt, recipes: recs }]) => (
            <SavedChefRow key={id} id={id} name={name} avatarUrl={avatarUrl} validatedAt={validatedAt} count={recs.length} />
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
                <div className="flex flex-wrap gap-2 mb-4">
                  {DIETS.map(d => (
                    <button key={d.key} onClick={() => { setFilterDiet(filterDiet === d.key ? '' : d.key); setShowFilter(false) }}
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
    </div>
  )
}
