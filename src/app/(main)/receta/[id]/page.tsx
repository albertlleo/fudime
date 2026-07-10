import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RecipeActions from './recipe-actions'
import Comments from './comments'
import BackButton from '@/components/back-button'
import VerifiedBadge from '@/components/verified-badge'
import type { RecipeWithCreator, CommentWithUser } from '@/lib/types'

export default async function RecetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('id', id)
    .single()

  if (!recipe || recipe.status !== 'published') notFound()

  const r = recipe as RecipeWithCreator

  const [likeRow, saveRow, likeCountResult, commentsData] = await Promise.all([
    user ? supabase.from('likes').select('recipe_id').eq('user_id', user.id).eq('recipe_id', id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from('saves').select('recipe_id').eq('user_id', user.id).eq('recipe_id', id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('recipe_id', id),
    supabase.from('comments').select('*, users!user_id(id, display_name, avatar_url)').eq('recipe_id', id).order('created_at', { ascending: true }),
  ])

  const tags: string[] = Array.isArray((r as any).tags) ? (r as any).tags : []
  const comments = ((commentsData as any).data ?? []) as CommentWithUser[]
  const likeCount = (likeCountResult as any).count ?? 0

  const creatorInitial = r.users.display_name[0].toUpperCase()

  return (
    <div className="min-h-dvh pb-20 overflow-y-auto" style={{ background: 'var(--cream)' }}>

      {/* Dark video hero */}
      <div className="relative bg-black">
        {/* Back button overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 pt-12 pb-3"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)' }}>
          <BackButton fallback="/" glass />
          <span className="text-white font-semibold text-sm truncate drop-shadow">{r.title}</span>
        </div>

        <video
          src={r.video_url}
          poster={r.thumbnail_url ?? undefined}
          controls
          playsInline
          autoPlay
          muted
          className="w-full"
          style={{ maxHeight: '60vh', objectFit: 'contain' }}
        />
      </div>

      {/* Cream content */}
      <div className="px-5 py-5 space-y-5">

        {/* Title + tags */}
        <div>
          <h1 className="text-2xl font-black leading-tight" style={{ color: 'var(--brown-900)' }}>{r.title}</h1>
          {r.description && (
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--brown-500)' }}>{r.description}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map(tag => (
                <Link key={tag} href={`/categoria/${encodeURIComponent(tag)}`}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                  style={{ background: 'var(--brown-100)', color: 'var(--brown-700)' }}>
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Creator */}
        <Link href={`/creador/${r.users.id}`}
          className="flex items-center gap-3 p-3.5 rounded-2xl transition-colors"
          style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          {r.users.avatar_url ? (
            <img src={r.users.avatar_url} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-black flex-shrink-0"
              style={{ background: 'var(--amber)' }}>
              {creatorInitial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm" style={{ color: 'var(--brown-900)' }}>@{r.users.display_name}</p>
              {r.users.validated_at && <VerifiedBadge />}
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brown-300)' }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>

        {/* Like / save */}
        <RecipeActions
          recipeId={id}
          isLiked={!!likeRow?.data}
          isSaved={!!saveRow?.data}
          likeCount={likeCount}
          isLoggedIn={!!user}
        />

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--brown-100)' }} />

        {/* Comments */}
        <Comments
          recipeId={id}
          initialComments={comments}
          currentUserId={user?.id ?? null}
        />
      </div>
    </div>
  )
}
