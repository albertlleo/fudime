'use server'

import { createClient } from '@/lib/supabase/server'
import type { CommentWithUser } from '@/lib/types'

export async function fetchComments(recipeId: string, currentUserId?: string): Promise<CommentWithUser[]> {
  const supabase = await createClient()
  const { data: comments } = await supabase
    .from('comments')
    .select('*, users!user_id(id, display_name, avatar_url)')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: true })

  if (!comments || comments.length === 0) return []

  const commentIds = comments.map((c: any) => c.id)

  const { data: likes } = await supabase
    .from('comment_likes')
    .select('comment_id, user_id')
    .in('comment_id', commentIds)

  const likesCount: Record<string, number> = {}
  const userLikedSet = new Set<string>()

  for (const like of (likes ?? [])) {
    likesCount[like.comment_id] = (likesCount[like.comment_id] ?? 0) + 1
    if (currentUserId && like.user_id === currentUserId) {
      userLikedSet.add(like.comment_id)
    }
  }

  return comments.map((c: any) => ({
    ...c,
    parent_id: c.parent_id ?? null,
    likes_count: likesCount[c.id] ?? 0,
    user_has_liked: userLikedSet.has(c.id),
  })) as CommentWithUser[]
}

export async function addComment(
  recipeId: string,
  content: string,
  parentId?: string,
): Promise<{ comment?: CommentWithUser; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const payload: any = { recipe_id: recipeId, user_id: user.id, content: content.trim() }
  if (parentId) payload.parent_id = parentId

  const { data: comment, error } = await supabase
    .from('comments')
    .insert(payload)
    .select('*, users!user_id(id, display_name, avatar_url)')
    .single()

  if (error) return { error: error.message }

  if (!parentId) {
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
  }

  return {
    comment: { ...comment, parent_id: comment.parent_id ?? null, likes_count: 0, user_has_liked: false } as CommentWithUser,
  }
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

export async function toggleCommentLike(commentId: string): Promise<{
  liked: boolean
  count: number
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { liked: false, count: 0, error: 'No autenticado' }

  const { data: existing } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id)
  } else {
    await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id })
  }

  const { count } = await supabase
    .from('comment_likes')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', commentId)

  return { liked: !existing, count: count ?? 0 }
}
