'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateRecipe(
  recipeId: string,
  data: {
    title: string
    description: string
    tags: string[]
    diet: string[]
    cookTime: string | null
  }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('recipes')
    .update({
      title: data.title.trim(),
      description: data.description.trim() || null,
      tags: data.tags,
      diet: data.diet,
      cook_time: data.cookTime,
    })
    .eq('id', recipeId)
    .eq('creator_id', user.id)

  if (error) return { error: error.message }
  return {}
}
