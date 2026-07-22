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
    thumbnailUrl?: string
  }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const patch: Record<string, unknown> = {
    title: data.title.trim(),
    description: data.description.trim() || null,
    tags: data.tags,
    diet: data.diet,
    cook_time: data.cookTime,
  }
  if (data.thumbnailUrl) patch.thumbnail_url = data.thumbnailUrl

  const { error } = await supabase
    .from('recipes')
    .update(patch)
    .eq('id', recipeId)
    .eq('creator_id', user.id)

  if (error) return { error: error.message }
  return {}
}
