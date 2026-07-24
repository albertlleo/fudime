import { createClient } from '@/lib/supabase/server'
import RecipeGrid from '@/components/recipe-grid'
import BackButton from '@/components/back-button'
import TiempoClient from './tiempo-client'
import type { RecipeWithCreator } from '@/lib/types'
import { TIMES } from '@/lib/categories'

export default async function TiempoPage({
  params,
  searchParams,
}: {
  params: Promise<{ tiempo: string }>
  searchParams: Promise<{ q?: string; cat?: string; diet?: string }>
}) {
  const { tiempo } = await params
  const { q, cat, diet } = await searchParams
  const decoded = decodeURIComponent(tiempo)
  const supabase = await createClient()

  const timeInfo = TIMES.find(t => t.key === decoded)

  let query = supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('status', 'published')
    .eq('cook_time', decoded)
    .order('likes_count', { ascending: false })
    .limit(60)

  if (q?.trim()) query = query.ilike('title', `%${q.trim()}%`)
  if (cat) query = query.contains('tags', [cat.toLowerCase()])
  if (diet) query = query.contains('diet', [diet])

  const { data: recipes } = await query
  const list = (recipes ?? []) as RecipeWithCreator[]
  const isFiltered = !!(q || cat || diet)

  return (
    <div className="min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <BackButton fallback="/chefs" />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            {timeInfo?.emoji ?? '⏱️'}
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--brown-900)' }}>
              {timeInfo?.label ?? decoded}
            </h1>
            {!isFiltered && (
              <p className="text-sm" style={{ color: 'var(--brown-500)' }}>
                {list.length} receta{list.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <TiempoClient
          activeQ={q ?? ''}
          activeCat={cat ?? ''}
          activeDiet={diet ?? ''}
          activeCount={list.length}
        />
      </div>

      <RecipeGrid
        recipes={list}
        emptyIcon="🔍"
        emptyTitle="Sin resultados"
        emptyText="Prueba con otro texto o cambia los filtros"
        feedBase={`/tiempo/${tiempo}/feed`}
      />
    </div>
  )
}
