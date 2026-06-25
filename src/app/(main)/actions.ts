'use server'

import { createClient } from '@/lib/supabase/server'

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
  }
}
