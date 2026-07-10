import { createClient } from '@/lib/supabase/server'
import ChefsPageClient from './chefs-client'
import type { User, RecipeWithCreator } from '@/lib/types'

export default async function ChefsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; diet?: string; tiempo?: string; sort?: string }>
}) {
  const { q, diet, tiempo, sort } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const searchTerm = q?.trim() ?? ''
  const isTrending = sort === 'trending'

  // ── Recipe data ──────────────────────────────────────────────
  const trendingPromise = supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('status', 'published')
    .order('likes_count', { ascending: false })
    .limit(8)

  let searchPromise = Promise.resolve({ data: [] as any[] })
  if (isTrending) {
    searchPromise = supabase
      .from('recipes')
      .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
      .eq('status', 'published')
      .order('likes_count', { ascending: false })
      .limit(40) as any
  } else if (searchTerm) {
    searchPromise = supabase
      .from('recipes')
      .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
      .eq('status', 'published')
      .ilike('title', `%${searchTerm}%`)
      .order('published_at', { ascending: false })
      .limit(40) as any
  } else if (diet) {
    searchPromise = supabase
      .from('recipes')
      .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
      .eq('status', 'published')
      .contains('diet', [diet])
      .order('likes_count', { ascending: false })
      .limit(40) as any
  } else if (tiempo) {
    searchPromise = supabase
      .from('recipes')
      .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
      .eq('status', 'published')
      .eq('cook_time', tiempo)
      .order('likes_count', { ascending: false })
      .limit(40) as any
  }

  // ── Chef data ────────────────────────────────────────────────
  const followsPromise = supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user!.id)

  const creatorsPromise = supabase
    .from('users')
    .select('id, display_name, avatar_url, validated_at, bio')
    .eq('role', 'creator')
    .order('display_name')

  // Recipes from last 7 days to compute trending chefs
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const weekRecipesPromise = supabase
    .from('recipes')
    .select('creator_id, likes_count, users!creator_id(id, display_name, avatar_url, validated_at, bio)')
    .eq('status', 'published')
    .gte('published_at', weekStart)

  const [
    { data: trendingRaw },
    { data: searchRaw },
    { data: followsRaw },
    { data: creatorsRaw },
    { data: weekRecipesRaw },
  ] = await Promise.all([trendingPromise, searchPromise, followsPromise, creatorsPromise, weekRecipesPromise])

  const trending = (trendingRaw ?? []) as RecipeWithCreator[]
  const searchResults = (searchRaw ?? []) as RecipeWithCreator[]
  const followedIds = (followsRaw ?? []).map((f: any) => f.following_id)
  const allCreators = (creatorsRaw ?? []) as Pick<User, 'id' | 'display_name' | 'avatar_url' | 'validated_at' | 'bio'>[]
  const followedSet = new Set(followedIds)

  // Aggregate weekly likes per creator → top 6
  type Chef = Pick<User, 'id' | 'display_name' | 'avatar_url' | 'validated_at' | 'bio'>
  const chefScoreMap = new Map<string, { score: number; chef: Chef }>()
  const recipesForTrending = (weekRecipesRaw ?? []).length > 0
    ? weekRecipesRaw!
    : (trendingRaw ?? []) // fallback to all-time trending recipes if no week data
  for (const r of recipesForTrending) {
    const cid = (r as any).creator_id as string
    const score = (r as any).likes_count ?? 0
    const u = (r as any).users as Chef | null
    if (!u || !cid) continue
    if (!chefScoreMap.has(cid)) chefScoreMap.set(cid, { score: 0, chef: u })
    chefScoreMap.get(cid)!.score += score
  }
  const trendingChefs = [...chefScoreMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(e => e.chef)

  return (
    <ChefsPageClient
      trending={trending}
      searchResults={searchResults}
      searchQuery={searchTerm}
      activeFilter={{ diet, tiempo, sort }}
      trendingChefs={trendingChefs}
      following={allCreators.filter(c => followedSet.has(c.id))}
      discover={allCreators.filter(c => !followedSet.has(c.id))}
    />
  )
}
