import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RecipeActions from './recipe-actions'
import type { RecipeWithCreator } from '@/lib/types'

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

  const [{ data: likeRow }, { data: saveRow }, { count: likeCount }] = await Promise.all([
    supabase.from('likes').select('recipe_id').eq('user_id', user!.id).eq('recipe_id', id).maybeSingle(),
    supabase.from('saves').select('recipe_id').eq('user_id', user!.id).eq('recipe_id', id).maybeSingle(),
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('recipe_id', id),
  ])

  const tags: string[] = Array.isArray((r as any).tags) ? (r as any).tags : []

  return (
    <div className="min-h-dvh pb-16 overflow-y-auto bg-stone-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Link
          href="/"
          className="w-9 h-9 flex-shrink-0 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold truncate">{r.title}</h1>
      </div>

      {/* Video */}
      <div className="relative w-full max-h-[65vh] bg-black flex items-center">
        <video
          src={r.video_url}
          poster={r.thumbnail_url ?? undefined}
          controls
          playsInline
          autoPlay
          muted
          className="w-full max-h-[65vh] object-contain"
        />
      </div>

      {/* Info */}
      <div className="px-4 py-5 space-y-5">
        <div>
          <h2 className="text-xl font-bold">{r.title}</h2>
          {r.description && (
            <p className="text-stone-400 text-sm mt-2 leading-relaxed">{r.description}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map(tag => (
                <Link
                  key={tag}
                  href={`/buscar?q=${encodeURIComponent(tag)}`}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-stone-300 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Creator */}
        <Link href={`/creador/${r.users.id}`} className="flex items-center gap-3">
          {r.users.avatar_url ? (
            <img src={r.users.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
              {r.users.display_name[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white font-semibold text-sm">@{r.users.display_name}</p>
            {r.users.validated_at && (
              <p className="text-amber-400 text-xs">Creador verificado</p>
            )}
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-stone-500 ml-auto">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>

        {/* Actions */}
        <RecipeActions
          recipeId={id}
          isLiked={!!likeRow}
          isSaved={!!saveRow}
          likeCount={likeCount ?? 0}
        />
      </div>
    </div>
  )
}
