import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RecipeGrid from '@/components/recipe-grid'
import FollowButton from './follow-button'
import ShareCreator from './share-creator'
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

  const [{ data: recipes }, followersResult, followRowResult] = await Promise.all([
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
  ])

  const followersCount = followersResult.count ?? 0
  const isFollowing = !followersResult.error && !!followRowResult.data
  const followsEnabled = !followersResult.error
  const isOwnProfile = authUser?.id === id

  const initials = creator.display_name
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-dvh pb-16 overflow-y-auto">
      {/* Back + Share */}
      <div className="px-4 pt-12 pb-2 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Volver
        </Link>
        <ShareCreator name={creator.display_name} id={id} />
      </div>

      {/* Header */}
      <div className="px-6 pb-6 flex flex-col items-center text-center">
        {creator.avatar_url ? (
          <img
            src={creator.avatar_url}
            alt={creator.display_name}
            className="w-24 h-24 rounded-full object-cover mb-4 ring-2 ring-stone-200"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-amber-500 flex items-center justify-center mb-4 text-2xl font-bold text-black">
            {initials}
          </div>
        )}

        <h1 className="text-xl font-bold text-stone-900">{creator.display_name}</h1>

        {creator.validated_at && (
          <span className="mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600">
            Creador verificado
          </span>
        )}

        {creator.bio && (
          <p className="mt-3 text-stone-500 text-sm leading-relaxed max-w-xs">{creator.bio}</p>
        )}

        {(creator.instagram_url || creator.tiktok_url) && (
          <div className="flex gap-3 mt-3">
            {creator.instagram_url && (
              <a href={creator.instagram_url} target="_blank" rel="noopener noreferrer"
                className="text-stone-500 hover:text-stone-700 text-xs flex items-center gap-1 transition-colors">
                Instagram
              </a>
            )}
            {creator.tiktok_url && (
              <a href={creator.tiktok_url} target="_blank" rel="noopener noreferrer"
                className="text-stone-500 hover:text-stone-700 text-xs flex items-center gap-1 transition-colors">
                TikTok
              </a>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-8 mt-5">
          <div className="flex flex-col items-center">
            <span className="text-stone-900 font-bold text-lg">{recipes?.length ?? 0}</span>
            <span className="text-stone-500 text-xs">Recetas</span>
          </div>
          {followsEnabled && (
            <div className="flex flex-col items-center">
              <span className="text-stone-900 font-bold text-lg">{followersCount}</span>
              <span className="text-stone-500 text-xs">Seguidores</span>
            </div>
          )}
        </div>

        {/* Follow / own profile */}
        <div className="mt-5">
          {isOwnProfile ? (
            <Link href="/perfil" className="px-6 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition-colors">
              Ver mi perfil
            </Link>
          ) : followsEnabled ? (
            <FollowButton
              creatorId={id}
              isFollowing={isFollowing}
              followersCount={followersCount}
            />
          ) : null}
        </div>
      </div>

      {/* Recipe grid */}
      <RecipeGrid
        recipes={(recipes ?? []) as RecipeWithCreator[]}
        emptyIcon="🍳"
        emptyTitle="Sin recetas aún"
        emptyText="Este creador no ha publicado recetas todavía"
      />
    </div>
  )
}
