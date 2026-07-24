import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import CreatorFeed from '@/components/creator-feed'
import type { RecipeWithCreator } from '@/lib/types'

export default async function PerfilFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>
}) {
  const { start } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: recipesRaw } = await supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('creator_id', user.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (!recipesRaw || recipesRaw.length === 0) notFound()

  const recipes = recipesRaw as RecipeWithCreator[]
  const initialIndex = start ? Math.max(0, recipes.findIndex(r => r.id === start)) : 0

  const recipeIds = recipes.map(r => r.id)

  const [likedResult, savedResult, commentCountsResult, likeCountsResult] = await Promise.all([
    supabase.from('likes').select('recipe_id').eq('user_id', user.id).in('recipe_id', recipeIds),
    supabase.from('saves').select('recipe_id').eq('user_id', user.id).in('recipe_id', recipeIds),
    supabase.from('comments').select('recipe_id').in('recipe_id', recipeIds),
    supabase.from('likes').select('recipe_id').in('recipe_id', recipeIds),
  ])

  const likedIds = (likedResult.data ?? []).map((r: any) => r.recipe_id)
  const savedIds = (savedResult.data ?? []).map((r: any) => r.recipe_id)

  const commentCountMap: Record<string, number> = {}
  for (const row of commentCountsResult.data ?? []) {
    commentCountMap[(row as any).recipe_id] = (commentCountMap[(row as any).recipe_id] ?? 0) + 1
  }

  const likeCountMap: Record<string, number> = {}
  for (const row of likeCountsResult.data ?? []) {
    likeCountMap[(row as any).recipe_id] = (likeCountMap[(row as any).recipe_id] ?? 0) + 1
  }

  return (
    <CreatorFeed
      recipes={recipes}
      likedIds={likedIds}
      savedIds={savedIds}
      likeCountMap={likeCountMap}
      commentCountMap={commentCountMap}
      userId={user.id}
      initialIndex={initialIndex}
    />
  )
}
