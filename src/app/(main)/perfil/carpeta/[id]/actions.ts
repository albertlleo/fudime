'use server'

import { createClient } from '@/lib/supabase/server'

export async function addToFolder(recipeId: string, folderId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { error } = await supabase.from('saves')
    .update({ folder_id: folderId })
    .eq('user_id', user.id)
    .eq('recipe_id', recipeId)
  if (error) return { error: error.message }
  return {}
}

export async function removeFromFolder(recipeId: string, folderId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { error } = await supabase.from('saves')
    .update({ folder_id: null })
    .eq('user_id', user.id)
    .eq('recipe_id', recipeId)
    .eq('folder_id', folderId)
  if (error) return { error: error.message }
  return {}
}
