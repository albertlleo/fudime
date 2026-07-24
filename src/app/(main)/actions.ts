'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { RecipeWithCreator } from '@/lib/types'
import { PAGE_SIZE } from './constants'

async function createNotification(supabase: Awaited<ReturnType<typeof createClient>>, data: {
  user_id: string
  type: 'like' | 'follow' | 'comment'
  actor_id: string
  recipe_id?: string | null
}) {
  try {
    await supabase.from('notifications').insert(data)
  } catch {}
}

export async function toggleLike(recipeId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data, error } = await supabase.rpc('toggle_like', {
    p_recipe_id: recipeId,
    p_user_id: user.id,
  })

  if (error || !data) return

  if (data.liked) {
    const { data: recipe } = await supabase.from('recipes').select('creator_id').eq('id', recipeId).single()
    if (recipe && recipe.creator_id !== user.id) {
      await createNotification(supabase, { user_id: recipe.creator_id, type: 'like', actor_id: user.id, recipe_id: recipeId })
    }
  }
}

export async function toggleSave(recipeId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: existing } = await supabase
    .from('saves')
    .select('recipe_id')
    .eq('user_id', user.id)
    .eq('recipe_id', recipeId)
    .maybeSingle()

  if (existing) {
    await supabase.from('saves').delete().eq('user_id', user.id).eq('recipe_id', recipeId)
  } else {
    await supabase.from('saves').insert({ user_id: user.id, recipe_id: recipeId })
  }
}

export async function toggleFollow(creatorId: string): Promise<{ isFollowing: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id === creatorId) return { isFollowing: false }

  const { data, error } = await supabase.rpc('toggle_follow', {
    p_follower_id: user.id,
    p_following_id: creatorId,
  })

  if (error || !data) return { isFollowing: false }

  const isFollowing: boolean = data.is_following
  if (isFollowing) {
    await createNotification(supabase, { user_id: creatorId, type: 'follow', actor_id: user.id })
  }
  revalidatePath(`/creador/${creatorId}`)
  return { isFollowing }
}

export async function fetchFollowingRecipes(): Promise<{
  recipes: RecipeWithCreator[]
  likedIds: string[]
  savedIds: string[]
  likeCountMap: Record<string, number>
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { recipes: [], likedIds: [], savedIds: [], likeCountMap: {} }

  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = (follows ?? []).map((f: any) => f.following_id)
  if (followingIds.length === 0) return { recipes: [], likedIds: [], savedIds: [], likeCountMap: {} }

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('status', 'published')
    .in('creator_id', followingIds)
    .order('published_at', { ascending: false })
    .limit(50)

  const list = (recipes ?? []) as RecipeWithCreator[]
  const ids = list.map(r => r.id)
  if (ids.length === 0) return { recipes: [], likedIds: [], savedIds: [], likeCountMap: {} }

  const [{ data: likes }, { data: saves }, { data: allLikes }] = await Promise.all([
    supabase.from('likes').select('recipe_id').eq('user_id', user.id).in('recipe_id', ids),
    supabase.from('saves').select('recipe_id').eq('user_id', user.id).in('recipe_id', ids),
    supabase.from('likes').select('recipe_id').in('recipe_id', ids),
  ])

  const likeCountMap = (allLikes ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.recipe_id] = (acc[l.recipe_id] ?? 0) + 1
    return acc
  }, {})

  return {
    recipes: list,
    likedIds: (likes ?? []).map(l => l.recipe_id),
    savedIds: (saves ?? []).map(s => s.recipe_id),
    likeCountMap,
  }
}

export async function fetchTrendingRecipes(): Promise<{
  recipes: RecipeWithCreator[]
  likedIds: string[]
  savedIds: string[]
  likeCountMap: Record<string, number>
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('status', 'published')
    .order('likes_count', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(50)

  const list = (recipes ?? []) as RecipeWithCreator[]
  const ids = list.map(r => r.id)

  const { data: allLikesForCount } = await supabase.from('likes').select('recipe_id').in('recipe_id', ids)
  const likeCountMap = (allLikesForCount ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.recipe_id] = (acc[l.recipe_id] ?? 0) + 1
    return acc
  }, {})

  if (!user || ids.length === 0) {
    return { recipes: list, likedIds: [], savedIds: [], likeCountMap }
  }

  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase.from('likes').select('recipe_id').eq('user_id', user.id).in('recipe_id', ids),
    supabase.from('saves').select('recipe_id').eq('user_id', user.id).in('recipe_id', ids),
  ])

  return {
    recipes: list,
    likedIds: (likes ?? []).map(l => l.recipe_id),
    savedIds: (saves ?? []).map(s => s.recipe_id),
    likeCountMap,
  }
}

export async function fetchMoreRecipes(cursor: string): Promise<{
  recipes: RecipeWithCreator[]
  likedIds: string[]
  savedIds: string[]
  likeCountMap: Record<string, number>
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('status', 'published')
    .lt('published_at', cursor)
    .order('published_at', { ascending: false })
    .limit(PAGE_SIZE)

  const list = (recipes ?? []) as RecipeWithCreator[]
  const ids = list.map(r => r.id)

  const { data: allLikesForCount2 } = await supabase.from('likes').select('recipe_id').in('recipe_id', ids)
  const likeCountMap = (allLikesForCount2 ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.recipe_id] = (acc[l.recipe_id] ?? 0) + 1
    return acc
  }, {})

  if (!user || ids.length === 0) {
    return { recipes: list, likedIds: [], savedIds: [], likeCountMap }
  }

  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase.from('likes').select('recipe_id').eq('user_id', user.id).in('recipe_id', ids),
    supabase.from('saves').select('recipe_id').eq('user_id', user.id).in('recipe_id', ids),
  ])

  return {
    recipes: list,
    likedIds: (likes ?? []).map(l => l.recipe_id),
    savedIds: (saves ?? []).map(s => s.recipe_id),
    likeCountMap,
  }
}
