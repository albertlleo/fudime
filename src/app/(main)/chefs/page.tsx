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

  const [
    { data: trendingRaw },
    { data: searchRaw },
    { data: followsRaw },
    { data: creatorsRaw },
  ] = await Promise.all([trendingPromise, searchPromise, followsPromise, creatorsPromise])

  const trending = (trendingRaw ?? []) as RecipeWithCreator[]
  const searchResults = (searchRaw ?? []) as RecipeWithCreator[]
  const followedIds = (followsRaw ?? []).map((f: any) => f.following_id)
  const allCreators = (creatorsRaw ?? []) as Pick<User, 'id' | 'display_name' | 'avatar_url' | 'validated_at' | 'bio'>[]
  const followedSet = new Set(followedIds)

  return (
    <ChefsPageClient
      trending={trending}
      searchResults={searchResults}
      searchQuery={searchTerm}
      activeFilter={{ diet, tiempo, sort }}
      following={allCreators.filter(c => followedSet.has(c.id))}
      discover={allCreators.filter(c => !followedSet.has(c.id))}
    />
  )
}
