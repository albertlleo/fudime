'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { publishRecipe } from './actions'
import FolderGrid from './folder-grid'
import VerifiedBadge from '@/components/verified-badge'
import WebsiteLink from '@/components/website-link'
import { DIETS, TIMES } from '@/lib/categories'
import type { User, Recipe } from '@/lib/types'
import type { FolderInfo } from './consumer-profile'

type Tab = 'recetas' | 'carpetas'
type Filter = 'todas' | 'publicadas' | 'borradores'

// ── Recipe card ────────────────────────────────────────────────────────────────
function RecipeCard({ recipe, onPublish }: { recipe: Recipe; onPublish: (id: string) => void }) {
  const isPublished = recipe.status === 'published'
  return (
    <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
      {recipe.thumbnail_url
        ? <img src={recipe.thumbnail_url} alt={recipe.title} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: 'var(--brown-100)' }}>🍴</div>
      }
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-white text-[10px] font-semibold line-clamp-1 leading-tight uppercase">{recipe.title}</p>
      </div>
      {!isPublished && (
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          <span className="bg-stone-900/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">Borrador</span>
          <button onClick={() => onPublish(recipe.id)}
            className="bg-amber-500/90 text-black text-[10px] font-semibold px-2 py-0.5 rounded-full text-left">
            Publicar
          </button>
        </div>
      )}
      {isPublished && (
        <Link href={`/perfil/feed?start=${recipe.id}`} className="absolute inset-0" aria-label={recipe.title} />
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CreatorProfile({
  user,
  recipes: initialRecipes,
  followersCount,
  followingCount,
  folders: initialFolders,
}: {
  user: User
  recipes: Recipe[]
  followersCount: number
  followingCount: number
  folders: FolderInfo[]
}) {
  const [tab, setTab] = useState<Tab>('recetas')

  // Recipe tab state
  const [recipes, setRecipes] = useState(initialRecipes)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('todas')
  const [dietFilter, setDietFilter] = useState<string | null>(null)
  const [tiempoFilter, setTiempoFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const initials = user.display_name
    .split(' ').map(w => w[0] ?? '').filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'

  const publishedCount = recipes.filter(r => r.status === 'published').length
  const activeFilterCount = (dietFilter ? 1 : 0) + (tiempoFilter ? 1 : 0)

  const filteredRecipes = useMemo(() => {
    let list = recipes
    if (filter === 'publicadas') list = list.filter(r => r.status === 'published')
    if (filter === 'borradores') list = list.filter(r => r.status !== 'published')
    if (dietFilter) list = list.filter(r => r.diet?.includes(dietFilter))
    if (tiempoFilter) list = list.filter(r => r.cook_time === tiempoFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r => r.title.toLowerCase().includes(q))
    }
    return list
  }, [recipes, filter, dietFilter, tiempoFilter, search])

  async function handlePublish(id: string) {
    const result = await publishRecipe(id)
    if (!result.error) {
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, status: 'published' as const, published_at: new Date().toISOString() } : r))
    }
  }

  return (
    <div className="relative min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>

      {/* Settings — top right */}
      <div className="absolute top-0 right-0 pt-14 pr-5 z-10">
        <Link href="/perfil/configuracion"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--brown-100)' }} aria-label="Configuración">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="w-4.5 h-4.5" style={{ color: 'var(--brown-500)' }}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </Link>
      </div>

      {/* Header */}
      <div className="pt-14 pb-6 px-5">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.display_name} className="w-20 h-20 rounded-full object-cover" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              : <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-black text-black" style={{ background: 'var(--amber)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>{initials}</div>
            }
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black leading-tight truncate" style={{ color: 'var(--brown-900)' }}>{user.display_name}</h1>
              <a href="/perfil/editar"
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'var(--brown-100)' }} aria-label="Editar perfil">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" style={{ color: 'var(--brown-500)' }}>
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </a>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {user.validated_at && <VerifiedBadge size="sm" />}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' }}>
                ✦ Creador
              </span>
            </div>
            {user.bio && (
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--brown-500)' }}>{user.bio}</p>
            )}
          </div>
        </div>
        {user.website_url && (
          <div className="mt-3">
            <WebsiteLink url={user.website_url}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity active:opacity-60"
              style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }} />
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="mx-5 mb-5 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid var(--brown-100)', backdropFilter: 'blur(8px)' }}>
        <div className="grid grid-cols-3">
          <div className="flex flex-col items-center py-3 gap-0.5" style={{ borderRight: '1px solid var(--brown-100)' }}>
            <span className="text-[17px] font-black leading-none" style={{ color: 'var(--brown-900)' }}>{publishedCount}</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'var(--brown-400)' }}>Recetas</span>
          </div>
          <Link href="/perfil/seguidores"
            className="flex flex-col items-center py-3 gap-0.5 active:opacity-60 transition-opacity"
            style={{ borderRight: '1px solid var(--brown-100)' }}>
            <span className="text-[17px] font-black leading-none" style={{ color: 'var(--brown-900)' }}>{followersCount}</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'var(--brown-400)' }}>Seguidores</span>
          </Link>
          <Link href="/perfil/siguiendo" className="flex flex-col items-center py-3 gap-0.5 active:opacity-60 transition-opacity">
            <span className="text-[17px] font-black leading-none" style={{ color: 'var(--brown-900)' }}>{followingCount}</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'var(--brown-400)' }}>Siguiendo</span>
          </Link>
        </div>
      </div>

      {/* Tab bar — Instagram style */}
      <div className="flex border-b" style={{ borderColor: 'var(--brown-100)' }}>
        <button onClick={() => setTab('recetas')}
          className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors"
          style={{ borderBottom: tab === 'recetas' ? '2px solid var(--brown-900)' : '2px solid transparent' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
            className="w-5 h-5" style={{ color: tab === 'recetas' ? 'var(--brown-900)' : 'var(--brown-400)' }}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: tab === 'recetas' ? 'var(--brown-900)' : 'var(--brown-400)' }}>
            Mis recetas
          </span>
        </button>
        <button onClick={() => setTab('carpetas')}
          className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors"
          style={{ borderBottom: tab === 'carpetas' ? '2px solid var(--brown-900)' : '2px solid transparent' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
            className="w-5 h-5" style={{ color: tab === 'carpetas' ? 'var(--brown-900)' : 'var(--brown-400)' }}>
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: tab === 'carpetas' ? 'var(--brown-900)' : 'var(--brown-400)' }}>
            Mis carpetas
          </span>
        </button>
      </div>

      {/* ── Mis recetas tab ── */}
      {tab === 'recetas' && (
        <div>
          {/* Search + filter */}
          <div className="px-4 pt-4 pb-2 flex flex-col gap-2.5">
            {/* Row 1: search bar + filter button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--brown-300)' }}>
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar mis recetas..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-900)', fontSize: 16 }} />
              </div>
              <button onClick={() => setShowFilters(true)}
                className="relative flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
                style={{
                  background: activeFilterCount > 0 ? 'var(--amber)' : '#fff',
                  border: `1.5px solid ${activeFilterCount > 0 ? 'var(--amber)' : 'var(--brown-100)'}`,
                }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  className="w-4.5 h-4.5" style={{ color: activeFilterCount > 0 ? '#fff' : 'var(--brown-500)' }}>
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: '#dc2626' }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Row 2: todas/publicadas/borradores pills */}
            <div className="flex gap-2">
              {(['todas', 'publicadas', 'borradores'] as Filter[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors"
                  style={{
                    background: filter === f ? 'var(--brown-900)' : 'var(--brown-100)',
                    color: filter === f ? '#fff' : 'var(--brown-600)',
                  }}>
                  {f}
                </button>
              ))}
            </div>

            {/* Active filter pills */}
            {(dietFilter || tiempoFilter) && (
              <div className="flex flex-wrap gap-2 items-center">
                {dietFilter && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--brown-100)', color: 'var(--brown-700)' }}>
                    {DIETS.find(d => d.key === dietFilter)?.emoji} {DIETS.find(d => d.key === dietFilter)?.label}
                    <button onClick={() => setDietFilter(null)} className="leading-none">×</button>
                  </span>
                )}
                {tiempoFilter && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--brown-100)', color: 'var(--brown-700)' }}>
                    {TIMES.find(t => t.key === tiempoFilter)?.emoji} {TIMES.find(t => t.key === tiempoFilter)?.label}
                    <button onClick={() => setTiempoFilter(null)} className="leading-none">×</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center px-8">
              <span className="text-4xl mb-3">🍴</span>
              <p className="font-semibold text-sm" style={{ color: 'var(--brown-700)' }}>
                {search ? `Sin resultados para "${search}"` : 'Sin recetas aún'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {filteredRecipes.map(r => <RecipeCard key={r.id} recipe={r} onPublish={handlePublish} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Mis carpetas tab ── */}
      {tab === 'carpetas' && (
        <div className="px-5 pt-5">
          <FolderGrid folders={initialFolders} />
        </div>
      )}

      {/* Filter sheet backdrop */}
      <div className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.45)', opacity: showFilters ? 1 : 0, pointerEvents: showFilters ? 'auto' : 'none' }}
        onClick={() => setShowFilters(false)} />

      {/* Filter sheet */}
      <div className="fixed inset-0 z-[70] pointer-events-none">
        <div className="h-full lg:pl-[72px] lg:flex lg:justify-center">
          <div className="w-full lg:max-w-[500px] h-full relative">
            <div className="absolute left-0 right-0 bottom-0 pointer-events-auto transition-transform duration-300 ease-out px-5 pt-4"
              style={{
                background: 'var(--cream)', borderRadius: '20px 20px 0 0',
                transform: showFilters ? 'translateY(0)' : 'translateY(100%)',
                paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 16px))',
              }}
              onClick={e => e.stopPropagation()}>

              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--brown-300)' }} />
              </div>

              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-base" style={{ color: 'var(--brown-900)' }}>Filtros</h3>
                {activeFilterCount > 0 && (
                  <button onClick={() => { setDietFilter(null); setTiempoFilter(null) }}
                    className="text-xs font-semibold" style={{ color: 'var(--terracotta)' }}>
                    Limpiar todo
                  </button>
                )}
              </div>

              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>
                Dietas e intolerancias
              </p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {DIETS.map(d => {
                  const active = dietFilter === d.key
                  return (
                    <button key={d.key} onClick={() => setDietFilter(active ? null : d.key)}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-colors"
                      style={{
                        background: active ? '#fffbeb' : '#fff',
                        border: `1.5px solid ${active ? 'var(--amber)' : 'var(--brown-100)'}`,
                      }}>
                      <span className="text-xl leading-none">{d.emoji}</span>
                      <span className="text-sm font-semibold" style={{ color: active ? 'var(--brown-900)' : 'var(--brown-700)' }}>
                        {d.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>
                Tiempo de cocción
              </p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {TIMES.map(t => {
                  const active = tiempoFilter === t.key
                  return (
                    <button key={t.key} onClick={() => setTiempoFilter(active ? null : t.key)}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-colors"
                      style={{
                        background: active ? '#fffbeb' : '#fff',
                        border: `1.5px solid ${active ? 'var(--amber)' : 'var(--brown-100)'}`,
                      }}>
                      <span className="text-xl leading-none">{t.emoji}</span>
                      <span className="text-sm font-semibold" style={{ color: active ? 'var(--brown-900)' : 'var(--brown-700)' }}>
                        {t.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <button onClick={() => setShowFilters(false)}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'var(--brown-900)' }}>
                Ver {filteredRecipes.length} receta{filteredRecipes.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
