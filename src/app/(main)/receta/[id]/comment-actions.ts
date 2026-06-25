'use server'

import { createClient } from '@/lib/supabase/server'
import type { CommentWithUser } from '@/lib/types'

export async function addComment(recipeId: string, content: string): Promise<{
  comment?: CommentWithUser
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ recipe_id: recipeId, user_id: user.id, content: content.trim() })
    .select('*, users!user_id(id, display_name, avatar_url)')
    .single()

  if (error) return { error: error.message }

  // Notify recipe creator (best-effort)
  try {
    const { data: recipe } = await supabase.from('recipes').select('creator_id').eq('id', recipeId).single()
    if (recipe && recipe.creator_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: recipe.creator_id,
        type: 'comment',
        actor_id: user.id,
        recipe_id: recipeId,
      })
    }
  } catch {}

  return { comment: comment as CommentWithUser }
}

export async function deleteComment(commentId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return {}
}
