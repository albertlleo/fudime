import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RecipeGrid from '@/components/recipe-grid'
import FollowButton from './follow-button'
import ShareCreator from './share-creator'
import BackButton from '@/components/back-button'
import type { User, RecipeWithCreator } from '@/lib/types'

export default async function CreadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const creator = profile as User

  const [{ data: recipes }, followersResult, followRowResult, savesResult] = await Promise.all([
    supabase
      .from('recipes')
      .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
      .eq('creator_id', id)
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
    authUser && authUser.id !== id
      ? supabase.from('follows').select('id').eq('follower_id', authUser.id).eq('following_id', id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('saves')
      .select('recipe_id, recipes!inner(creator_id)', { count: 'exact', head: true })
      .eq('recipes.creator_id', id),
  ])

  const followersCount = followersResult.count ?? 0
  const isFollowing = !followersResult.error && !!followRowResult.data
  const followsEnabled = !followersResult.error
  const isOwnProfile = authUser?.id === id

  const recipeList = (recipes ?? []) as RecipeWithCreator[]
  const totalLikes = recipeList.reduce((sum, r) => sum + ((r as any).likes_count ?? 0), 0)
  const totalSaves = savesResult.count ?? 0
  const totalReacciones = totalLikes + totalSaves

  const initials = creator.display_name
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="min-h-dvh pb-20 overflow-y-auto" style={{ background: 'var(--cream)' }}>

      {/* Back + Share */}
      <div className="px-5 pt-14 pb-2 flex items-center justify-between">
        <BackButton fallback="/" />
        <ShareCreator name={creator.display_name} id={id} />
      </div>

      {/* Header */}
      <div className="px-5 pb-5">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt={creator.display_name}
              className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-black text-black flex-shrink-0"
              style={{ background: 'var(--amber)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
              {initials}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>
                {creator.display_name}
              </h1>
              {creator.validated_at && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' }}>
                  ✦ Verificado
                </span>
              )}
            </div>

            {creator.bio && (
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--brown-500)' }}>
                {creator.bio}
              </p>
            )}

            {(creator.instagram_url || creator.tiktok_url) && (
              <div className="flex gap-2 mt-2.5">
                {creator.instagram_url && (
                  <a href={creator.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                    style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }}>
                    Instagram
                  </a>
                )}
                {creator.tiktok_url && (
                  <a href={creator.tiktok_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                    style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }}>
                    TikTok
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats — 3 columns */}
        <div className="flex rounded-2xl overflow-hidden mb-3"
          style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <div className="flex-1 flex flex-col items-center py-3">
            <span className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>
              {recipeList.length}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--brown-500)' }}>Recetas</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-3" style={{ borderLeft: '1px solid var(--brown-100)' }}>
            <span className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>
              {followersCount}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--brown-500)' }}>Seguidores</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-3" style={{ borderLeft: '1px solid var(--brown-100)' }}>
            <span className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>
              {totalReacciones}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--brown-500)' }}>Reacciones</span>
          </div>
        </div>

        {/* Follow / profile button */}
        {isOwnProfile ? (
          <Link href="/perfil"
            className="w-full flex items-center justify-center py-2.5 rounded-2xl text-sm font-semibold transition-colors"
            style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }}>
            Mi perfil
          </Link>
        ) : followsEnabled ? (
          <FollowButton creatorId={id} isFollowing={isFollowing} followersCount={followersCount} />
        ) : null}
      </div>

      {/* Recipe grid — clicks open creator feed starting at the tapped recipe */}
      <RecipeGrid
        recipes={recipeList}
        emptyIcon="🍳"
        emptyTitle="Sin recetas aún"
        emptyText="Este creador no ha publicado recetas todavía"
        makeHref={(r) => `/creador/${id}/feed?start=${r.id}`}
      />
    </div>
  )
}
