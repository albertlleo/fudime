import { createClient } from '@/lib/supabase/server'
import GuardadosClient from './guardados-client'
import type { RecipeWithCreator } from '@/lib/types'

export default async function GuardadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: saves } = await supabase
    .from('saves')
    .select('recipe_id, saved_at, recipes(*, users!creator_id(id, display_name, avatar_url, validated_at))')
    .eq('user_id', user!.id)
    .order('saved_at', { ascending: false })

  const recipes = (saves ?? []).map(s => s.recipes).filter(Boolean) as unknown as RecipeWithCreator[]

  return <GuardadosClient recipes={recipes} />
}
