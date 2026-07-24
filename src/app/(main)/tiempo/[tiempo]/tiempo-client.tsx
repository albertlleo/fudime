'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CATEGORIES, CAT_EMOJIS, DIETS } from '@/lib/categories'

interface Props {
  activeQ: string
  activeCat: string
  activeDiet: string
  activeCount: number
}

export default function TiempoClient({ activeQ, activeCat, activeDiet, activeCount }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [q, setQ] = useState(activeQ)
  const [showFilters, setShowFilters] = useState(false)

  const hasFilters = !!(activeCat || activeDiet)

  function buildUrl(overrides: { q?: string; cat?: string; diet?: string }) {
    const params = new URLSearchParams()
    const nextQ = overrides.q !== undefined ? overrides.q : activeQ
    const nextCat = overrides.cat !== undefined ? overrides.cat : activeCat
    const nextDiet = overrides.diet !== undefined ? overrides.diet : activeDiet
    if (nextQ) params.set('q', nextQ)
    if (nextCat) params.set('cat', nextCat)
    if (nextDiet) params.set('diet', nextDiet)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function handleSearch(v: string) {
    setQ(v)
    startTransition(() => router.push(buildUrl({ q: v })))
  }

  function toggleCat(key: string) {
    startTransition(() => router.push(buildUrl({ cat: activeCat === key ? '' : key })))
  }

  function toggleDiet(key: string) {
    startTransition(() => router.push(buildUrl({ diet: activeDiet === key ? '' : key })))
  }

  function clearAll() {
    setQ('')
    startTransition(() => router.push(pathname))
    setShowFilters(false)
  }

  return (
    <>
      <div className="flex gap-2 mt-4">
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--brown-300)' }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="search" value={q} onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar recetas..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-900)' }} />
        </div>
        <button onClick={() => setShowFilters(true)}
          className="relative flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: hasFilters ? 'var(--amber)' : '#fff', border: `1.5px solid ${hasFilters ? 'var(--amber)' : 'var(--brown-100)'}` }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="w-4.5 h-4.5" style={{ color: hasFilters ? '#fff' : 'var(--brown-500)' }}>
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          </svg>
          {hasFilters && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: '#dc2626' }}>
              {(activeCat ? 1 : 0) + (activeDiet ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {(hasFilters || activeQ) && (
        <div className="flex flex-wrap gap-2 mt-2.5 items-center">
          {activeQ && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--brown-100)', color: 'var(--brown-700)' }}>
              "{activeQ}" <button onClick={() => handleSearch('')}>×</button>
            </span>
          )}
          {activeCat && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--brown-100)', color: 'var(--brown-700)' }}>
              {CAT_EMOJIS[activeCat.toLowerCase()] ?? '🍴'} {activeCat}
              <button onClick={() => toggleCat(activeCat)}>×</button>
            </span>
          )}
          {activeDiet && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--brown-100)', color: 'var(--brown-700)' }}>
              {DIETS.find(d => d.key === activeDiet)?.emoji} {DIETS.find(d => d.key === activeDiet)?.label}
              <button onClick={() => toggleDiet(activeDiet)}>×</button>
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--brown-400)' }}>
            {activeCount} receta{activeCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.45)', opacity: showFilters ? 1 : 0, pointerEvents: showFilters ? 'auto' : 'none' }}
        onClick={() => setShowFilters(false)} />

      {/* Sheet */}
      <div className="fixed inset-0 z-[70] pointer-events-none">
        <div className="h-full lg:pl-[72px] lg:flex lg:justify-center">
          <div className="w-full lg:max-w-[500px] h-full relative">
            <div className="absolute left-0 right-0 bottom-0 pointer-events-auto transition-transform duration-300 ease-out px-5 pt-4"
              style={{ background: 'var(--cream)', borderRadius: '20px 20px 0 0',
                transform: showFilters ? 'translateY(0)' : 'translateY(100%)',
                paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 16px))' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--brown-300)' }} />
              </div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-base" style={{ color: 'var(--brown-900)' }}>Filtros</h3>
                {hasFilters && <button onClick={clearAll} className="text-xs font-semibold" style={{ color: 'var(--terracotta)' }}>Limpiar todo</button>}
              </div>

              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>Categoría</p>
              <div className="grid grid-cols-2 gap-2 mb-5 max-h-48 overflow-y-auto">
                {CATEGORIES.map(cat => {
                  const active = activeCat.toLowerCase() === cat.toLowerCase()
                  return (
                    <button key={cat} onClick={() => toggleCat(cat)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors"
                      style={{ background: active ? 'var(--amber)' : '#fff', border: `1.5px solid ${active ? 'var(--amber)' : 'var(--brown-100)'}` }}>
                      <span className="text-base leading-none flex-shrink-0">{CAT_EMOJIS[cat.toLowerCase()] ?? '🍴'}</span>
                      <span className="text-xs font-semibold leading-tight" style={{ color: active ? '#fff' : 'var(--brown-700)' }}>{cat}</span>
                    </button>
                  )
                })}
              </div>

              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>Dietas e intolerancias</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {DIETS.map(d => {
                  const active = activeDiet === d.key
                  return (
                    <button key={d.key} onClick={() => toggleDiet(d.key)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-colors"
                      style={{ background: active ? 'var(--amber)' : '#fff', border: `1.5px solid ${active ? 'var(--amber)' : 'var(--brown-100)'}` }}>
                      <span className="text-base">{d.emoji}</span>
                      <span className="text-sm font-semibold" style={{ color: active ? '#fff' : 'var(--brown-700)' }}>{d.label}</span>
                    </button>
                  )
                })}
              </div>

              <button onClick={() => setShowFilters(false)}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'var(--brown-900)' }}>
                Ver {activeCount} receta{activeCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
