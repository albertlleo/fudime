'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import VerifiedBadge from '@/components/verified-badge'
import type { User, RecipeWithCreator } from '@/lib/types'

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Aperitivos', 'Entrantes', 'Ensaladas', 'Cremas y sopas', 'Platos de cuchara',
  'Pasta', 'Arroces', 'Verduras', 'Carne y aves', 'Pescado y marisco',
  'Plant Based', 'Huevos y tortillas', 'Panadería', 'Masas y hojaldres',
  'Comida rápida', 'Postres y dulces', 'Salsas y aliños', 'Bebidas',
]

const CAT_EMOJIS: Record<string, string> = {
  'aperitivos': '🥨', 'entrantes': '🥗', 'ensaladas': '🥙', 'cremas y sopas': '🍲',
  'platos de cuchara': '🫕', 'pasta': '🍝', 'arroces': '🍚', 'verduras': '🥦',
  'carne y aves': '🍗', 'pescado y marisco': '🐟', 'plant based': '🌿',
  'huevos y tortillas': '🍳', 'panadería': '🍞', 'masas y hojaldres': '🥐',
  'comida internacional': '🌍', 'comida rápida': '🍔', 'bocadillos y sándwiches': '🥪',
  'postres y dulces': '🍰', 'salsas y aliños': '🫙', 'bebidas': '🥤',
}

const DIETS = [
  { key: 'vegana', label: 'Vegana', emoji: '🌱' },
  { key: 'vegetariana', label: 'Vegetariana', emoji: '🥕' },
  { key: 'sin gluten', label: 'Sin gluten', emoji: '🌾' },
  { key: 'sin lactosa', label: 'Sin lactosa', emoji: '🥛' },
]

const TIMES = [
  { key: 'menos-15', label: 'Menos de 15 min', emoji: '⚡' },
  { key: '15-30', label: '15–30 min', emoji: '🕐' },
  { key: '30-60', label: '30–60 min', emoji: '⏱️' },
  { key: 'mas-1h', label: 'Más de 1 hora', emoji: '🍳' },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function RecipeThumbH({ recipe }: { recipe: RecipeWithCreator }) {
  return (
    <Link href={`/buscar/feed?start=${recipe.id}`} className="flex-shrink-0 w-28 block">
      <div className="relative w-28 rounded-2xl overflow-hidden bg-stone-900" style={{ aspectRatio: '9/16' }}>
        {recipe.thumbnail_url
          ? <img src={recipe.thumbnail_url} alt={recipe.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">🍴</div>
        }
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="text-white text-[10px] font-semibold line-clamp-1 leading-tight">{recipe.title}</p>
        </div>
      </div>
    </Link>
  )
}

function RecipeThumbGrid({ recipe }: { recipe: RecipeWithCreator }) {
  return (
    <Link href={`/creador/${recipe.users.id}/feed?start=${recipe.id}`} className="block">
      <div className="relative aspect-[3/4] bg-stone-900 overflow-hidden">
        {recipe.thumbnail_url
          ? <img src={recipe.thumbnail_url} alt={recipe.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">🍴</div>
        }
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="text-white text-[10px] font-bold line-clamp-1 leading-tight">{recipe.title}</p>
          <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>@{recipe.users.display_name}</p>
        </div>
      </div>
    </Link>
  )
}

type Chef = Pick<User, 'id' | 'display_name' | 'avatar_url' | 'validated_at' | 'bio'>

function ChefCard({ chef }: { chef: Chef }) {
  const initials = chef.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <Link href={`/creador/${chef.id}`} className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity">
      <div className="relative">
        {chef.avatar_url
          ? <img src={chef.avatar_url} alt={chef.display_name} className="w-24 h-24 rounded-full object-cover" />
          : <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-black text-black"
              style={{ background: 'var(--amber)' }}>{initials}</div>
        }
        {chef.validated_at && (
          <div className="absolute -bottom-0.5 -right-0.5 rounded-full"
            style={{ background: '#fff', padding: '1.5px' }}>
            <VerifiedBadge size="md" />
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-center leading-tight line-clamp-2 max-w-[90px]"
        style={{ color: 'var(--brown-900)' }}>{chef.display_name}</p>
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  trending: RecipeWithCreator[]
  searchResults: RecipeWithCreator[]
  searchQuery: string
  activeFilter: { diet?: string; tiempo?: string; sort?: string }
  trendingChefs: Chef[]
  following: Chef[]
  discover: Chef[]
}

export default function ChefsPageClient({
  trending, searchResults, searchQuery, activeFilter, trendingChefs, following, discover,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [tab, setTab] = useState<'buscar' | 'chefs'>(
    // If there's an active search/filter, default to buscar tab
    searchQuery || activeFilter.diet || activeFilter.tiempo || activeFilter.sort ? 'buscar' : 'buscar'
  )
  const [searchValue, setSearchValue] = useState(searchQuery)
  const [chefQuery, setChefQuery] = useState('')

  const isFiltered = !!(searchQuery || activeFilter.diet || activeFilter.tiempo || activeFilter.sort)
  const isTrending = activeFilter.sort === 'trending'

  const activeLabel = isTrending ? '🔥 Tendencias'
    : activeFilter.diet ? DIETS.find(d => d.key === activeFilter.diet)?.label ?? activeFilter.diet
    : activeFilter.tiempo ? TIMES.find(t => t.key === activeFilter.tiempo)?.label ?? activeFilter.tiempo
    : null

  function handleSearch(v: string) {
    setSearchValue(v)
    startTransition(() => {
      router.push(v.trim() ? `/chefs?q=${encodeURIComponent(v.trim())}` : '/chefs')
    })
  }

  const cq = chefQuery.toLowerCase().trim()
  const filteredFollowing = following.filter(c => !cq || c.display_name.toLowerCase().includes(cq))
  const filteredDiscover = discover.filter(c => !cq || c.display_name.toLowerCase().includes(cq))

  return (
    <div className="h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>

      {/* Fixed header: title + tabs + search */}
      <div className="flex-shrink-0 px-5 pt-14 pb-4">
        <h1 className="text-2xl font-black mb-4" style={{ color: 'var(--brown-900)' }}>Descubrir</h1>

        {/* Tab strip */}
        <div className="flex gap-1 p-1 rounded-2xl mb-3" style={{ background: 'var(--brown-100)' }}>
          {(['buscar', 'chefs'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all capitalize"
              style={{
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? 'var(--brown-900)' : 'var(--brown-500)',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              {t === 'buscar' ? 'Recetas' : 'Chefs'}
            </button>
          ))}
        </div>

        {/* Search input — changes per tab */}
        {tab === 'buscar' ? (
          <div>
            <input
              type="text"
              value={searchValue}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar recetas..."
              className="input-cream"
            />
            {isFiltered && (
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs" style={{ color: 'var(--brown-500)' }}>
                  {activeLabel
                    ? `${activeLabel} · ${searchResults.length} receta${searchResults.length !== 1 ? 's' : ''}`
                    : `${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''} para "${searchQuery}"`
                  }
                </p>
                <button onClick={() => { setSearchValue(''); router.push('/chefs') }}
                  className="text-xs font-semibold" style={{ color: 'var(--terracotta)' }}>
                  Quitar filtro
                </button>
              </div>
            )}
          </div>
        ) : (
          <input
            type="text"
            value={chefQuery}
            onChange={e => setChefQuery(e.target.value)}
            placeholder="Buscar chef..."
            className="input-cream"
          />
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-20">

        {/* ── BUSCAR TAB ──────────────────────────────────── */}
        {tab === 'buscar' && (
          <div>

            {/* Search / filter results */}
            {isFiltered ? (
              searchResults.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center px-8">
                  <span className="text-4xl mb-3">🔍</span>
                  <p className="text-sm" style={{ color: 'var(--brown-500)' }}>Sin resultados</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-0.5">
                  {searchResults.map(r => <RecipeThumbGrid key={r.id} recipe={r} />)}
                </div>
              )
            ) : (
              <>
                {/* Tendencias – fila horizontal deslizable */}
                {trending.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between px-5 mb-3">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brown-300)' }}>
                        🔥 Tendencias
                      </p>
                      <button onClick={() => router.push('/chefs?sort=trending')}
                        className="text-xs font-semibold" style={{ color: 'var(--brown-500)' }}>
                        Ver más
                      </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
                      {trending.map(r => <RecipeThumbH key={r.id} recipe={r} />)}
                      {/* Ver más card */}
                      <button onClick={() => router.push('/chefs?sort=trending')}
                        className="flex-shrink-0 w-28 active:opacity-70 transition-opacity">
                        <div className="relative w-28 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2"
                          style={{ aspectRatio: '9/16', background: 'var(--brown-100)' }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--brown-200, #d6cdc4)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                              className="w-5 h-5" style={{ color: 'var(--brown-700)' }}>
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                          <p className="text-xs font-bold text-center leading-tight px-2" style={{ color: 'var(--brown-700)' }}>Ver más</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Categorías */}
                <div className="px-5 mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-300)' }}>
                    Categorías
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                      <Link key={cat}
                        href={`/categoria/${encodeURIComponent(cat.toLowerCase())}`}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                        style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
                        <span className="text-xl leading-none">{CAT_EMOJIS[cat.toLowerCase()] ?? '🍴'}</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--brown-700)' }}>{cat}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Dietas e intolerancias */}
                <div className="px-5 mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-300)' }}>
                    Dietas e intolerancias
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {DIETS.map(d => (
                      <Link key={d.key}
                        href={`/chefs?diet=${encodeURIComponent(d.key)}`}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                        style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
                        <span className="text-xl leading-none">{d.emoji}</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--brown-700)' }}>{d.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Tiempo de cocinado */}
                <div className="px-5 mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-300)' }}>
                    Tiempo de cocinado
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {TIMES.map(t => (
                      <Link key={t.key}
                        href={`/chefs?tiempo=${t.key}`}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                        style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
                        <span className="text-xl leading-none">{t.emoji}</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--brown-700)' }}>{t.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── CHEFS TAB ───────────────────────────────────── */}
        {tab === 'chefs' && (
          <div className="pt-4">

            {/* EN TENDENCIA */}
            {!cq && trendingChefs.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-5"
                  style={{ color: 'var(--brown-300)' }}>
                  En tendencia
                </p>
                <div className="grid grid-cols-3 gap-x-2 gap-y-3 px-5">
                  {trendingChefs.map(chef => <ChefCard key={chef.id} chef={chef} />)}
                </div>
              </div>
            )}

            {/* SIGUIENDO */}
            {filteredFollowing.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-5"
                  style={{ color: 'var(--brown-300)' }}>
                  Siguiendo
                </p>
                <div className="grid grid-cols-3 gap-x-2 gap-y-3 px-5">
                  {filteredFollowing.map(chef => <ChefCard key={chef.id} chef={chef} />)}
                </div>
              </div>
            )}

            {/* DESCUBRIR */}
            {filteredDiscover.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-5"
                  style={{ color: 'var(--brown-300)' }}>
                  {cq ? 'Resultados' : 'Descubrir'}
                </p>
                <div className="grid grid-cols-3 gap-x-2 gap-y-3 px-5">
                  {filteredDiscover.map(chef => <ChefCard key={chef.id} chef={chef} />)}
                </div>
              </div>
            )}

            {filteredFollowing.length === 0 && filteredDiscover.length === 0 && trendingChefs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
                  style={{ background: 'var(--brown-100)' }}>👨‍🍳</div>
                <h2 className="font-bold text-base mb-1" style={{ color: 'var(--brown-900)' }}>
                  {cq ? 'Sin resultados' : 'Aún no hay chefs'}
                </h2>
                <p className="text-sm" style={{ color: 'var(--brown-500)' }}>
                  {cq ? `No hay chefs con "${chefQuery}"` : 'Los creadores aparecerán aquí cuando se registren'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
