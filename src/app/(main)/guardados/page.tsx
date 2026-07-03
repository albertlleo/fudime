import { createClient } from '@/lib/supabase/server'
import RecipeGrid from '@/components/recipe-grid'
import type { RecipeWithCreator } from '@/lib/types'

export default async function GuardadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: saves } = await supabase
    .from('saves')
    .select('recipe_id, saved_at, recipes(*, users!creator_id(id, display_name, avatar_url, validated_at))')
    .eq('user_id', user!.id)
    .order('saved_at', { ascending: false })

  const recipes = (saves ?? []).map((s) => s.recipes).filter(Boolean) as unknown as RecipeWithCreator[]

  return (
    <div className="min-h-dvh pb-20 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-5">
        <h1 className="text-2xl font-black" style={{ color: 'var(--brown-900)' }}>Guardados</h1>
        {recipes.length > 0 && (
          <p className="text-sm mt-1" style={{ color: 'var(--brown-500)' }}>
            {recipes.length} receta{recipes.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      <RecipeGrid
        recipes={recipes}
        emptyIcon="🔖"
        emptyTitle="Nada guardado aún"
        emptyText="Guarda recetas del feed pulsando el marcador"
      />
    </div>
  )
}
