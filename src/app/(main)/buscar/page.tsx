import { createClient } from '@/lib/supabase/server'
import SearchInput from '@/components/search-input'
import RecipeGrid from '@/components/recipe-grid'
import Link from 'next/link'
import type { RecipeWithCreator, User } from '@/lib/types'

const POPULAR_TAGS = ['pasta', 'pollo', 'vegano', 'postre', 'rápido', 'ensalada', 'arroz', 'sopas', 'snacks', 'smoothie']

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()
  const searchTerm = q?.trim() ?? ''

  const isTag = searchTerm.startsWith('#')

  // Recipes query
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

  // Creators query — only when there's a non-tag search term
  const creatorsPromise = searchTerm && !isTag
    ? supabase
        .from('users')
        .select('id, display_name, avatar_url, validated_at, role')
        .eq('role', 'creator')
        .ilike('display_name', `%${searchTerm}%`)
        .limit(6)
    : Promise.resolve({ data: [] })

  // Popular tags
  let popularTags: string[] = POPULAR_TAGS
  try {
    const { data } = await (supabase as any).rpc('get_popular_tags', { p_limit: 12 })
    if (data && data.length > 0) popularTags = data.map((r: any) => r.tag as string)
  } catch {}

  const [{ data: recipes }, { data: creators }] = await Promise.all([recipeQuery, creatorsPromise])

  const creatorList = (creators ?? []) as Pick<User, 'id' | 'display_name' | 'avatar_url' | 'validated_at'>[]

  return (
    <div className="min-h-dvh pb-16 overflow-y-auto">
      <div className="px-4 pt-10 pb-2">
        <h1 className="text-xl font-bold text-stone-900 mb-3">Buscar</h1>
        <SearchInput defaultValue={q ?? ''} />
        {q && !isTag && (
          <p className="text-stone-500 text-xs mt-2">
            {(recipes?.length ?? 0) + creatorList.length} resultado{(recipes?.length ?? 0) + creatorList.length !== 1 ? 's' : ''} para &ldquo;{q}&rdquo;
          </p>
        )}
      </div>

      {/* Popular tags — only when no search */}
      {!searchTerm && (
        <div className="px-4 pb-4">
          <p className="text-stone-500 text-xs font-medium uppercase tracking-wide mb-2">Categorías</p>
          <div className="flex flex-wrap gap-2">
            {popularTags.map(tag => (
              <Link
                key={tag}
                href={`/categoria/${encodeURIComponent(tag)}`}
                className="px-3 py-1.5 bg-stone-100 hover:bg-amber-100 hover:text-amber-800 text-stone-700 text-sm rounded-full transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Creator results */}
      {creatorList.length > 0 && (
        <div className="px-4 mb-2">
          <p className="text-stone-500 text-xs font-medium uppercase tracking-wide mb-2">Creadores</p>
          <div className="bg-white rounded-2xl divide-y divide-stone-100 shadow-sm">
            {creatorList.map(creator => {
              const initials = creator.display_name
                .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <Link
                  key={creator.id}
                  href={`/creador/${creator.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors"
                >
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt={creator.display_name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-900 font-medium text-sm">{creator.display_name}</span>
                      {creator.validated_at && (
                        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
                          <circle cx="12" cy="12" r="12" fill="#F59E0B" />
                          <path d="M7 12.5l3.5 3.5 6.5-7" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-stone-400 text-xs">Ver perfil</span>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-stone-300 flex-shrink-0">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recipe results */}
      {searchTerm && (recipes?.length ?? 0) > 0 && (
        <div className="px-4 mb-1">
          <p className="text-stone-500 text-xs font-medium uppercase tracking-wide mb-2">Recetas</p>
        </div>
      )}

      <RecipeGrid
        recipes={(recipes ?? []) as RecipeWithCreator[]}
        emptyIcon="🔍"
        emptyTitle={searchTerm ? (creatorList.length > 0 ? 'Sin recetas' : 'Sin resultados') : 'Busca una receta'}
        emptyText={
          searchTerm
            ? creatorList.length > 0
              ? `No hay recetas con "${searchTerm}"`
              : `No hay recetas ni creadores con "${searchTerm}"`
            : 'Escribe un nombre o explora por categoría'
        }
      />
    </div>
  )
}
