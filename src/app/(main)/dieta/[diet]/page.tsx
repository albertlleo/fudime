import { createClient } from '@/lib/supabase/server'
import RecipeGrid from '@/components/recipe-grid'
import BackButton from '@/components/back-button'
import DietaClient from './dieta-client'
import type { RecipeWithCreator } from '@/lib/types'
import { DIETS } from '@/lib/categories'

export default async function DietaPage({
  params,
  searchParams,
}: {
  params: Promise<{ diet: string }>
  searchParams: Promise<{ q?: string; cat?: string; tiempo?: string }>
}) {
  const { diet } = await params
  const { q, cat, tiempo } = await searchParams
  const decoded = decodeURIComponent(diet)
  const supabase = await createClient()

  const dietInfo = DIETS.find(d => d.key === decoded)

  let query = supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('status', 'published')
    .contains('diet', [decoded])
    .order('likes_count', { ascending: false })
    .limit(60)

  if (q?.trim()) query = query.ilike('title', `%${q.trim()}%`)
  if (cat) query = query.contains('tags', [cat.toLowerCase()])
  if (tiempo) query = query.eq('cook_time', tiempo)

  const { data: recipes } = await query
  const list = (recipes ?? []) as RecipeWithCreator[]
  const isFiltered = !!(q || cat || tiempo)

  return (
    <div className="min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <BackButton fallback="/chefs" />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            {dietInfo?.emoji ?? '🥗'}
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--brown-900)' }}>
              {dietInfo?.label ?? decoded}
            </h1>
            {!isFiltered && (
              <p className="text-sm" style={{ color: 'var(--brown-500)' }}>
                {list.length} receta{list.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <DietaClient
          activeQ={q ?? ''}
          activeCat={cat ?? ''}
          activeTiempo={tiempo ?? ''}
          activeCount={list.length}
        />
      </div>

      <RecipeGrid
        recipes={list}
        emptyIcon="🔍"
        emptyTitle="Sin resultados"
        emptyText="Prueba con otro texto o cambia los filtros"
        feedBase={`/dieta/${diet}/feed`}
      />
    </div>
  )
}
