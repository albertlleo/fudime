import { createClient } from '@/lib/supabase/server'
import SearchInput from '@/components/search-input'
import RecipeGrid from '@/components/recipe-grid'
import type { RecipeWithCreator } from '@/lib/types'

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(40)

  const searchTerm = q?.trim() ?? ''
  if (searchTerm.startsWith('#')) {
    const tag = searchTerm.slice(1).toLowerCase()
    if (tag) query = query.contains('tags', [tag])
  } else if (searchTerm) {
    query = query.ilike('title', `%${searchTerm}%`)
  }

  const { data: recipes } = await query

  return (
    <div className="min-h-dvh pb-16 overflow-y-auto">
      <div className="px-4 pt-10 pb-4">
        <h1 className="text-xl font-bold text-stone-900 mb-3">Buscar</h1>
        <SearchInput defaultValue={q ?? ''} />
        {q && (
          <p className="text-stone-500 text-xs mt-2">
            {recipes?.length ?? 0} resultado{recipes?.length !== 1 ? 's' : ''} para &ldquo;{q}&rdquo;
          </p>
        )}
      </div>
      <RecipeGrid
        recipes={(recipes ?? []) as RecipeWithCreator[]}
        emptyIcon="🔍"
        emptyTitle={q ? 'Sin resultados' : 'Busca una receta'}
        emptyText={q ? `No hay recetas que coincidan con "${q}"` : 'Escribe el nombre de una receta'}
      />
    </div>
  )
}
