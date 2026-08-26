'use client'

import { useState, useMemo } from 'react'
import RecipeGrid from '@/components/recipe-grid'
import { CATEGORIES, CAT_EMOJIS, DIETS, TIMES, isLongLabel } from '@/lib/categories'
import type { RecipeWithCreator } from '@/lib/types'

interface Props {
  recipes: RecipeWithCreator[]
  creatorId: string
}

export default function CreadorClient({ recipes, creatorId }: Props) {
  const [q, setQ] = useState('')
  const [activeCat, setActiveCat] = useState('')
  const [activeDiet, setActiveDiet] = useState('')
  const [activeTiempo, setActiveTiempo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const hasFilters = !!(activeCat || activeDiet || activeTiempo)
  const filterCount = (activeCat ? 1 : 0) + (activeDiet ? 1 : 0) + (activeTiempo ? 1 : 0)

  const filtered = useMemo(() => {
    return recipes.filter(r => {
      if (q && !r.title.toLowerCase().includes(q.toLowerCase())) return false
      if (activeCat && !r.tags.some(t => t.toLowerCase() === activeCat.toLowerCase())) return false
      if (activeDiet && !r.diet?.includes(activeDiet)) return false
      if (activeTiempo && r.cook_time !== activeTiempo) return false
      return true
    })
  }, [recipes, q, activeCat, activeDiet, activeTiempo])

  function clearAll() {
    setActiveCat('')
    setActiveDiet('')
    setActiveTiempo('')
    setShowFilters(false)
  }

  return (
    <>
      {/* Search + filter row */}
      <div className="flex gap-2 px-5 mb-4">
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--brown-300)' }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar recetas..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-900)', fontSize: 16 }}
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="relative flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: hasFilters ? 'var(--amber)' : '#fff', border: `1.5px solid ${hasFilters ? 'var(--amber)' : 'var(--brown-100)'}` }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="w-4.5 h-4.5" style={{ color: hasFilters ? '#fff' : 'var(--brown-500)' }}>
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          </svg>
          {hasFilters && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: '#dc2626' }}>
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active pills */}
      {(hasFilters || q) && (
        <div className="flex flex-wrap gap-2 px-5 mb-3 items-center">
          {q && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--brown-100)', color: 'var(--brown-700)' }}>
              "{q}" <button onClick={() => setQ('')} className="leading-none">×</button>
            </span>
          )}
          {activeCat && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--brown-100)', color: 'var(--brown-700)' }}>
              {CAT_EMOJIS[activeCat.toLowerCase()] ?? '🍴'} {activeCat}
              <button onClick={() => setActiveCat('')} className="leading-none">×</button>
            </span>
          )}
          {activeDiet && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--brown-100)', color: 'var(--brown-700)' }}>
              {DIETS.find(d => d.key === activeDiet)?.emoji} {DIETS.find(d => d.key === activeDiet)?.label}
              <button onClick={() => setActiveDiet('')} className="leading-none">×</button>
            </span>
          )}
          {activeTiempo && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--brown-100)', color: 'var(--brown-700)' }}>
              {TIMES.find(t => t.key === activeTiempo)?.emoji} {TIMES.find(t => t.key === activeTiempo)?.label}
              <button onClick={() => setActiveTiempo('')} className="leading-none">×</button>
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--brown-400)' }}>
            {filtered.length} receta{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Recipe grid */}
      <RecipeGrid
        recipes={filtered}
        emptyIcon="🔍"
        emptyTitle={hasFilters || q ? 'Sin resultados' : 'Sin recetas aún'}
        emptyText={hasFilters || q ? 'Prueba con otros filtros' : 'Este creador no ha publicado recetas todavía'}
        feedBase={`/creador/${creatorId}/feed`}
      />

      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.45)', opacity: showFilters ? 1 : 0, pointerEvents: showFilters ? 'auto' : 'none' }}
        onClick={() => setShowFilters(false)} />

      {/* Filter sheet */}
      <div className="fixed inset-0 z-[70] pointer-events-none">
        <div className="h-full lg:pl-[72px] lg:flex lg:justify-center">
          <div className="w-full lg:max-w-[500px] h-full relative">
            <div className="absolute left-0 right-0 bottom-0 pointer-events-auto transition-transform duration-300 ease-out overflow-y-auto"
              style={{ background: 'var(--cream)', borderRadius: '20px 20px 0 0',
                transform: showFilters ? 'translateY(0)' : 'translateY(100%)',
                maxHeight: '85dvh' }}
              onClick={e => e.stopPropagation()}>
              <div className="px-5 pt-4" style={{ paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 16px))' }}>
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full" style={{ background: 'var(--brown-300)' }} />
                </div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-black text-base" style={{ color: 'var(--brown-900)' }}>Filtros</h3>
                  {hasFilters && <button onClick={clearAll} className="text-xs font-semibold" style={{ color: 'var(--terracotta)' }}>Limpiar todo</button>}
                </div>

                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>Categoría</p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {CATEGORIES.map(cat => {
                    const active = activeCat.toLowerCase() === cat.toLowerCase()
                    return (
                      <button key={cat} onClick={() => { setActiveCat(active ? '' : cat); setShowFilters(false) }}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-left transition-colors"
                        style={{ background: active ? '#fffbeb' : '#fff', border: `1.5px solid ${active ? 'var(--amber)' : 'var(--brown-100)'}` }}>
                        <span className="text-xl leading-none flex-shrink-0">{CAT_EMOJIS[cat.toLowerCase()] ?? '🍴'}</span>
                        <span className={`${isLongLabel(cat) ? 'text-[11px] sm:text-sm' : 'text-sm'} font-semibold leading-tight`} style={{ color: active ? 'var(--brown-900)' : 'var(--brown-700)' }}>{cat}</span>
                      </button>
                    )
                  })}
                </div>

                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>Dietas e intolerancias</p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {DIETS.map(d => {
                    const active = activeDiet === d.key
                    return (
                      <button key={d.key} onClick={() => { setActiveDiet(active ? '' : d.key); setShowFilters(false) }}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-colors"
                        style={{ background: active ? '#fffbeb' : '#fff', border: `1.5px solid ${active ? 'var(--amber)' : 'var(--brown-100)'}` }}>
                        <span className="text-xl leading-none">{d.emoji}</span>
                        <span className="text-sm font-semibold" style={{ color: active ? 'var(--brown-900)' : 'var(--brown-700)' }}>{d.label}</span>
                      </button>
                    )
                  })}
                </div>

                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>Tiempo de cocción</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {TIMES.map(t => {
                    const active = activeTiempo === t.key
                    return (
                      <button key={t.key} onClick={() => { setActiveTiempo(active ? '' : t.key); setShowFilters(false) }}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-colors"
                        style={{ background: active ? '#fffbeb' : '#fff', border: `1.5px solid ${active ? 'var(--amber)' : 'var(--brown-100)'}` }}>
                        <span className="text-xl leading-none">{t.emoji}</span>
                        <span className={`${isLongLabel(t.label) ? 'text-[11px] sm:text-sm' : 'text-sm'} font-semibold leading-tight`} style={{ color: active ? 'var(--brown-900)' : 'var(--brown-700)' }}>{t.label}</span>
                      </button>
                    )
                  })}
                </div>

                <button onClick={() => setShowFilters(false)}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'var(--brown-900)' }}>
                  Ver {filtered.length} receta{filtered.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
