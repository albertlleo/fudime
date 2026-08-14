'use server'

import { createClient } from '@/lib/supabase/server'
import type { CommentWithUser } from '@/lib/types'

export async function fetchComments(recipeId: string, currentUserId?: string): Promise<CommentWithUser[]> {
  const supabase = await createClient()
  const { data: comments } = await supabase
    .from('comments')
    .select('*, users!user_id(id, display_name, username, avatar_url, validated_at)')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: true })

  if (!comments || comments.length === 0) return []

  const commentIds = comments.map((c: any) => c.id)
  const commenterIds = [...new Set(comments.map((c: any) => c.user_id as string))]

  const [{ data: likes }, { data: followRows }] = await Promise.all([
    supabase.from('comment_likes').select('comment_id, user_id').in('comment_id', commentIds),
    supabase.from('follows').select('following_id').in('following_id', commenterIds),
  ])

  const likesCount: Record<string, number> = {}
  const userLikedSet = new Set<string>()

  for (const like of (likes ?? [])) {
    likesCount[like.comment_id] = (likesCount[like.comment_id] ?? 0) + 1
    if (currentUserId && like.user_id === currentUserId) {
      userLikedSet.add(like.comment_id)
    }
  }

  const followerCountMap: Record<string, number> = {}
  for (const row of (followRows ?? [])) {
    const id = (row as any).following_id as string
    followerCountMap[id] = (followerCountMap[id] ?? 0) + 1
  }

  return comments.map((c: any) => ({
    ...c,
    parent_id: c.parent_id ?? null,
    likes_count: likesCount[c.id] ?? 0,
    user_has_liked: userLikedSet.has(c.id),
    users: { ...c.users, followers_count: followerCountMap[c.user_id] ?? 0 },
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

  const { data: recipeCheck } = await supabase
    .from('recipes')
    .select('creator_id, users!creator_id(comments_enabled)')
    .eq('id', recipeId)
    .single()
  const creatorData = recipeCheck?.users as { comments_enabled?: boolean } | null
  const recipeCreatorId = recipeCheck?.creator_id
  // Block comments only if disabled AND the commenter is not the creator
  if (creatorData && creatorData.comments_enabled === false && recipeCreatorId !== user.id) {
    return { error: 'El creador ha desactivado los comentarios en sus publicaciones.' }
  }

  const payload: any = { recipe_id: recipeId, user_id: user.id, content: content.trim() }
  if (parentId) payload.parent_id = parentId

  const { data: comment, error } = await supabase
    .from('comments')
    .insert(payload)
    .select('*, users!user_id(id, display_name, username, avatar_url, validated_at)')
    .single()

  if (error) return { error: error.message }

  const { count: myFollowers } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', user.id)

  try {
    if (!parentId) {
      if (recipeCreatorId && recipeCreatorId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: recipeCreatorId, type: 'comment', actor_id: user.id, recipe_id: recipeId, comment_id: comment.id,
        })
      }
    } else {
      const { data: parent } = await supabase.from('comments').select('user_id').eq('id', parentId).single()
      if (parent && parent.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: parent.user_id, type: 'comment_reply', actor_id: user.id, recipe_id: recipeId, comment_id: comment.id,
        })
      }
    }
  } catch {}

  return {
    comment: {
      ...comment,
      parent_id: comment.parent_id ?? null,
      likes_count: 0,
      user_has_liked: false,
      users: { ...comment.users, followers_count: myFollowers ?? 0 },
    } as CommentWithUser,
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
    try {
      const { data: comment } = await supabase.from('comments').select('user_id, recipe_id').eq('id', commentId).single()
      if (comment && comment.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: comment.user_id, type: 'comment_like', actor_id: user.id, recipe_id: comment.recipe_id, comment_id: commentId,
        })
      }
    } catch {}
  }

  const { count } = await supabase
    .from('comment_likes')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', commentId)

  return { liked: !existing, count: count ?? 0 }
}
