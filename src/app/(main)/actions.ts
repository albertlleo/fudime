'use server'

import { createClient } from '@/lib/supabase/server'
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

  const { data: existing } = await supabase
    .from('likes')
    .select('recipe_id')
    .eq('user_id', user.id)
    .eq('recipe_id', recipeId)
    .maybeSingle()

  if (existing) {
    await supabase.from('likes').delete().eq('user_id', user.id).eq('recipe_id', recipeId)
  } else {
    await supabase.from('likes').insert({ user_id: user.id, recipe_id: recipeId })
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

export async function toggleFollow(creatorId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id === creatorId) return

  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', creatorId)
    .maybeSingle()

  if (existing) {
    await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', creatorId)
  } else {
    await supabase.from('follows').insert({ follower_id: user.id, following_id: creatorId })
    await createNotification(supabase, { user_id: creatorId, type: 'follow', actor_id: user.id })
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

  if (!user || ids.length === 0) {
    return { recipes: list, likedIds: [], savedIds: [], likeCountMap: {} }
  }

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

  if (!user || ids.length === 0) {
    return { recipes: list, likedIds: [], savedIds: [], likeCountMap: {} }
  }

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
