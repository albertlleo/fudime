import { createClient } from '@/lib/supabase/server'
import SearchInput from '@/components/search-input'
import RecipeGrid from '@/components/recipe-grid'
import Link from 'next/link'
import VerifiedBadge from '@/components/verified-badge'
import type { RecipeWithCreator, User } from '@/lib/types'

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
  'comida rápida': '🍔', 'postres y dulces': '🍰', 'salsas y aliños': '🫙', 'bebidas': '🥤',
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

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; diet?: string; tiempo?: string; sort?: string }>
}) {
  const { q, diet, tiempo, sort } = await searchParams
  const supabase = await createClient()
  const searchTerm = q?.trim() ?? ''
  const isTag = searchTerm.startsWith('#')

  const isTrending = sort === 'trending'

  let recipeQuery = supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('status', 'published')
    .order(isTrending ? 'likes_count' : 'published_at', { ascending: false })
    .limit(isTrending ? 40 : 40)

  if (isTag) {
    const tag = searchTerm.slice(1).toLowerCase()
    if (tag) recipeQuery = recipeQuery.contains('tags', [tag])
  } else if (searchTerm) {
    recipeQuery = recipeQuery.ilike('title', `%${searchTerm}%`)
  } else if (diet) {
    recipeQuery = recipeQuery.contains('diet', [diet])
  } else if (tiempo) {
    recipeQuery = recipeQuery.eq('cook_time', tiempo)
  }

  const creatorsPromise = searchTerm && !isTag
    ? supabase
        .from('users')
        .select('id, display_name, avatar_url, validated_at, role')
        .eq('role', 'creator')
        .ilike('display_name', `%${searchTerm}%`)
        .limit(6)
    : Promise.resolve({ data: [] })

  const trendingPromise = !searchTerm && !diet && !tiempo
    ? supabase
        .from('recipes')
        .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
        .eq('status', 'published')
        .order('likes_count', { ascending: false })
        .limit(8)
    : Promise.resolve({ data: [] })

  const [{ data: recipes }, { data: creators }, { data: trendingRaw }] = await Promise.all([
    recipeQuery, creatorsPromise, trendingPromise,
  ])

  const creatorList = (creators ?? []) as Pick<User, 'id' | 'display_name' | 'avatar_url' | 'validated_at'>[]
  const trendingList = (trendingRaw ?? []) as RecipeWithCreator[]
  const totalResults = (recipes?.length ?? 0) + creatorList.length
  const isFiltered = !!(searchTerm || diet || tiempo || isTrending)
  const filterLabel = isTrending ? 'Más populares'
    : diet ? DIETS.find(d => d.key === diet)?.label
    : tiempo ? TIMES.find(t => t.key === tiempo)?.label
    : null

  return (
    <div className="h-dvh overflow-y-auto pb-20" style={{ background: 'var(--cream)' }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-8">
        <h1 className="text-2xl font-black mb-4" style={{ color: 'var(--brown-900)' }}>
          {isTrending ? '🔥 Tendencias' : 'Buscar'}
        </h1>
        <SearchInput defaultValue={q ?? ''} />
        {isFiltered && (
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs" style={{ color: 'var(--brown-500)' }}>
              {isTrending
                ? `🔥 ${totalResults} receta${totalResults !== 1 ? 's' : ''} más populares`
                : filterLabel
                ? `Filtrando por "${filterLabel}" · ${totalResults} receta${totalResults !== 1 ? 's' : ''}`
                : `${totalResults} resultado${totalResults !== 1 ? 's' : ''} para "${q}"`}
            </p>
            {(filterLabel || isTrending) && (
              <Link href="/buscar" className="text-xs font-semibold" style={{ color: 'var(--terracotta)' }}>
                Volver
              </Link>
            )}
          </div>
        )}
      </div>

      {/* No filter state: show categories + sections */}
      {!isFiltered && (
        <>
          {/* Tendencias - horizontal scroll */}
          {trendingList.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between px-5 mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brown-300)' }}>
                  🔥 Tendencias
                </p>
                <Link href="/buscar?sort=trending" className="text-xs font-semibold" style={{ color: 'var(--brown-500)' }}>
                  Ver más
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
                {trendingList.map(recipe => (
                  <Link key={recipe.id} href={`/receta/${recipe.id}`} className="flex-shrink-0 w-28">
                    <div className="relative w-28 rounded-2xl overflow-hidden bg-stone-900" style={{ aspectRatio: '9/16' }}>
                      {recipe.thumbnail_url ? (
                        <img src={recipe.thumbnail_url} alt={recipe.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🍴</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-[10px] font-semibold line-clamp-2 leading-tight">{recipe.title}</p>
                      </div>
                    </div>
                  </Link>
                ))}
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
                <Link
                  key={cat}
                  href={`/categoria/${encodeURIComponent(cat.toLowerCase())}`}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-colors"
                  style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}
                >
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
            <div className="flex flex-wrap gap-2">
              {DIETS.map(d => (
                <Link
                  key={d.key}
                  href={`/buscar?diet=${encodeURIComponent(d.key)}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
                  style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}
                >
                  <span className="text-base">{d.emoji}</span>
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
            <div className="flex flex-wrap gap-2">
              {TIMES.map(t => (
                <Link
                  key={t.key}
                  href={`/buscar?tiempo=${t.key}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
                  style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}
                >
                  <span className="text-base">{t.emoji}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--brown-700)' }}>{t.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Creator results */}
      {creatorList.length > 0 && (
        <div className="px-5 mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-300)' }}>
            Creadores
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            {creatorList.map((creator, i) => {
              const initials = creator.display_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <Link key={creator.id} href={`/creador/${creator.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-stone-50"
                  style={i > 0 ? { borderTop: '1px solid var(--brown-100)' } : {}}>
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt={creator.display_name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-black flex-shrink-0"
                      style={{ background: 'var(--amber)' }}>{initials}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate" style={{ color: 'var(--brown-900)' }}>
                        {creator.display_name}
                      </span>
                      {creator.validated_at && <VerifiedBadge />}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--brown-500)' }}>Ver perfil →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recipe results (search / filter) */}
      {isFiltered && (
        <>
          {(recipes?.length ?? 0) > 0 && (
            <div className="px-5 mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brown-300)' }}>
                Recetas
              </p>
            </div>
          )}
          <RecipeGrid
            recipes={(recipes ?? []) as RecipeWithCreator[]}
            emptyIcon="🔍"
            emptyTitle={creatorList.length > 0 ? 'Sin recetas' : 'Sin resultados'}
            emptyText={creatorList.length > 0
              ? `No hay recetas con "${searchTerm || filterLabel}"`
              : `No hay resultados para "${searchTerm || filterLabel}"`}
          />
        </>
      )}
    </div>
  )
}
