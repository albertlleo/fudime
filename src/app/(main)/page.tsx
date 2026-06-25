import { createClient } from '@/lib/supabase/server'
import Feed from '@/components/feed'
import type { RecipeWithCreator } from '@/lib/types'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  const recipeList = (recipes ?? []) as RecipeWithCreator[]
  const recipeIds = recipeList.map(r => r.id)

  const [{ data: likes }, { data: saves }, { data: allLikes }] = await Promise.all([
    recipeIds.length > 0
      ? supabase.from('likes').select('recipe_id').eq('user_id', user!.id).in('recipe_id', recipeIds)
      : Promise.resolve({ data: [] }),
    recipeIds.length > 0
      ? supabase.from('saves').select('recipe_id').eq('user_id', user!.id).in('recipe_id', recipeIds)
      : Promise.resolve({ data: [] }),
    recipeIds.length > 0
      ? supabase.from('likes').select('recipe_id').in('recipe_id', recipeIds)
      : Promise.resolve({ data: [] }),
  ])

  const likeCountMap = (allLikes ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.recipe_id] = (acc[l.recipe_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <Feed
      recipes={recipeList}
      likedIds={(likes ?? []).map(l => l.recipe_id)}
      savedIds={(saves ?? []).map(s => s.recipe_id)}
      likeCountMap={likeCountMap}
      userId={user!.id}
    />
  )
}
