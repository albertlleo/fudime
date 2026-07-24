import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import CreatorFeed from '@/components/creator-feed'
import type { RecipeWithCreator } from '@/lib/types'

export default async function CategoriaFeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>
  searchParams: Promise<{ start?: string }>
}) {
  const { tag } = await params
  const { start } = await searchParams
  const decoded = decodeURIComponent(tag)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: recipesRaw } = await supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('status', 'published')
    .contains('tags', [decoded])
    .order('likes_count', { ascending: false })
    .limit(40)

  if (!recipesRaw || recipesRaw.length === 0) notFound()

  let recipes = recipesRaw as RecipeWithCreator[]
  if (start) {
    const idx = recipes.findIndex(r => r.id === start)
    if (idx > 0) recipes = [recipes[idx], ...recipes.slice(0, idx), ...recipes.slice(idx + 1)]
  }

  const recipeIds = recipes.map(r => r.id)

  const admin = createAdminClient()
  const [likedResult, savedResult, commentCountsResult, likeCountsResult] = await Promise.all([
    user
      ? supabase.from('likes').select('recipe_id').eq('user_id', user.id).in('recipe_id', recipeIds)
      : Promise.resolve({ data: [] }),
    user
      ? supabase.from('saves').select('recipe_id').eq('user_id', user.id).in('recipe_id', recipeIds)
      : Promise.resolve({ data: [] }),
    supabase.from('comments').select('recipe_id').in('recipe_id', recipeIds),
    admin.from('likes').select('recipe_id').in('recipe_id', recipeIds),
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
      userId={user?.id ?? null}
    />
  )
}
