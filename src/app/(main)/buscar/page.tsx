import { createClient } from '@/lib/supabase/server'
import SearchInput from '@/components/search-input'
import RecipeGrid from '@/components/recipe-grid'
import Link from 'next/link'
import type { RecipeWithCreator, User } from '@/lib/types'

const POPULAR_TAGS = ['pasta', 'pollo', 'vegano', 'postre', 'rápido', 'ensalada', 'arroz', 'sopas', 'snacks', 'smoothie']

const TAG_EMOJIS: Record<string, string> = {
  pasta: '🍝', pollo: '🍗', vegano: '🥗', postre: '🍰', rápido: '⚡',
  ensalada: '🥙', arroz: '🍚', sopas: '🍲', snacks: '🍿', smoothie: '🥤',
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()
  const searchTerm = q?.trim() ?? ''
  const isTag = searchTerm.startsWith('#')

  let recipeQuery = supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(40)

  if (isTag) {
    const tag = searchTerm.slice(1).toLowerCase()
    if (tag) recipeQuery = recipeQuery.contains('tags', [tag])
  } else if (searchTerm) {
    recipeQuery = recipeQuery.ilike('title', `%${searchTerm}%`)
  }

  const creatorsPromise = searchTerm && !isTag
    ? supabase
        .from('users')
        .select('id, display_name, avatar_url, validated_at, role')
        .eq('role', 'creator')
        .ilike('display_name', `%${searchTerm}%`)
        .limit(6)
    : Promise.resolve({ data: [] })

  let popularTags: string[] = POPULAR_TAGS
  try {
    const { data } = await (supabase as any).rpc('get_popular_tags', { p_limit: 12 })
    if (data && data.length > 0) popularTags = data.map((r: any) => r.tag as string)
  } catch {}

  const trendingPromise = !searchTerm
    ? supabase
        .from('recipes')
        .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
        .eq('status', 'published')
        .order('likes_count', { ascending: false })
        .limit(8)
    : Promise.resolve({ data: [] })

  const [{ data: recipes }, { data: creators }, { data: trendingRaw }] = await Promise.all([recipeQuery, creatorsPromise, trendingPromise])
  const creatorList = (creators ?? []) as Pick<User, 'id' | 'display_name' | 'avatar_url' | 'validated_at'>[]
  const trendingList = (trendingRaw ?? []) as RecipeWithCreator[]
  const totalResults = (recipes?.length ?? 0) + creatorList.length

  return (
    <div className="min-h-dvh pb-20 overflow-y-auto" style={{ background: 'var(--cream)' }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-black mb-4" style={{ color: 'var(--brown-900)' }}>Buscar</h1>
        <SearchInput defaultValue={q ?? ''} />
        {searchTerm && !isTag && (
          <p className="text-xs mt-2" style={{ color: 'var(--brown-500)' }}>
            {totalResults} resultado{totalResults !== 1 ? 's' : ''} para &ldquo;{q}&rdquo;
          </p>
        )}
      </div>

      {/* Categories — only when no search */}
      {!searchTerm && (
        <div className="px-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-300)' }}>
            Categorías
          </p>
          <div className="grid grid-cols-2 gap-2">
            {popularTags.map(tag => (
              <Link
                key={tag}
                href={`/categoria/${encodeURIComponent(tag)}`}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-colors"
                style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}
              >
                <span className="text-xl leading-none">{TAG_EMOJIS[tag] ?? '🍴'}</span>
                <span className="text-sm font-semibold capitalize" style={{ color: 'var(--brown-700)' }}>
                  {tag}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Creator results */}
      {creatorList.length > 0 && (
        <div className="px-5 mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-300)' }}>
            Creadores
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            {creatorList.map((creator, i) => {
              const initials = creator.display_name
                .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <Link
                  key={creator.id}
                  href={`/creador/${creator.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-stone-50"
                  style={i > 0 ? { borderTop: '1px solid var(--brown-100)' } : {}}
                >
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt={creator.display_name}
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-black flex-shrink-0"
                      style={{ background: 'var(--amber)' }}>
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate" style={{ color: 'var(--brown-900)' }}>
                        {creator.display_name}
                      </span>
                      {creator.validated_at && (
                        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0">
                          <circle cx="8" cy="8" r="8" fill="#F59E0B" />
                          <path d="M4.5 8.3l2.3 2.3 4.3-4.6" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--brown-500)' }}>Ver perfil →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Trending — only when no search */}
      {!searchTerm && trendingList.length > 0 && (
        <div className="mb-1">
          <div className="px-5 mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brown-300)' }}>
              🔥 Tendencias
            </p>
          </div>
          <RecipeGrid
            recipes={trendingList}
            emptyIcon="🍴"
            emptyTitle="Sin recetas"
            emptyText=""
          />
        </div>
      )}

      {/* Recipe label for search results */}
      {searchTerm && (recipes?.length ?? 0) > 0 && (
        <div className="px-5 mb-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brown-300)' }}>
            Recetas
          </p>
        </div>
      )}

      {searchTerm && (
        <RecipeGrid
          recipes={(recipes ?? []) as RecipeWithCreator[]}
          emptyIcon="🔍"
          emptyTitle={creatorList.length > 0 ? 'Sin recetas' : 'Sin resultados'}
          emptyText={
            creatorList.length > 0
              ? `No hay recetas con "${searchTerm}"`
              : `No hay recetas ni creadores con "${searchTerm}"`
          }
        />
      )}
    </div>
  )
}
