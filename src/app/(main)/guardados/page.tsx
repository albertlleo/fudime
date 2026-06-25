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

  const recipes = (saves ?? [])
    .map((s) => s.recipes)
    .filter(Boolean) as unknown as RecipeWithCreator[]

  return (
    <div className="min-h-dvh pb-16 overflow-y-auto">
      <div className="px-4 pt-10 pb-4">
        <h1 className="text-xl font-bold text-stone-900">Guardados</h1>
        {recipes.length > 0 && (
          <p className="text-stone-500 text-sm mt-0.5">{recipes.length} receta{recipes.length !== 1 ? 's' : ''}</p>
        )}
      </div>
      <RecipeGrid
        recipes={recipes}
        emptyIcon="🔖"
        emptyTitle="Nada guardado aún"
        emptyText="Guarda recetas del feed para verlas aquí"
      />
    </div>
  )
}
