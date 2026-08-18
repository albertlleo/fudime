import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MarkRead from './mark-read'
import BackButton from '@/components/back-button'
import type { NotificationWithDetails } from '@/lib/types'

function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (s < 60) return 'ahora'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function notifText(type: string): string {
  switch (type) {
    case 'like': return 'dio like a tu receta'
    case 'follow': return 'empezó a seguirte'
    case 'comment': return 'ha escrito un comentario'
    case 'comment_like': return 'le gustó tu comentario'
    case 'comment_reply': return 'ha contestado a tu comentario'
    case 'new_recipe': return 'ha subido una nueva receta'
    default: return 'interactuó contigo'
  }
}

const AMBER = '#d97706'
const BADGE_BG = '#ede8e3'
const BADGE_BORDER = '#e0d9d1'

function BadgeIcon({ type }: { type: string }) {
  const icon = (() => {
    switch (type) {
      case 'like':
      case 'comment_like':
        return (
          <svg viewBox="0 0 24 24" fill={AMBER} className="w-3 h-3">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        )
      case 'comment':
      case 'comment_reply':
        return (
          <svg viewBox="0 0 24 24" fill={AMBER} className="w-3 h-3">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )
      case 'follow':
        return (
          <svg viewBox="0 0 24 24" fill={AMBER} className="w-3 h-3">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        )
      case 'new_recipe':
        return (
          <svg viewBox="0 0 24 24" fill={AMBER} className="w-3 h-3">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 24 24" fill={AMBER} className="w-3 h-3">
            <circle cx="12" cy="12" r="6" />
          </svg>
        )
    }
  })()

  return (
    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
      style={{ background: BADGE_BG, border: `1.5px solid ${BADGE_BORDER}` }}>
      {icon}
    </div>
  )
}

export default async function NotificacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: rawNotifs }] = await Promise.all([
    user ? supabase.from('users').select('role').eq('id', user.id).single() : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('notifications')
          .select('*, actor:users!actor_id(id, display_name, avatar_url), recipe:recipes!recipe_id(id, title, thumbnail_url, creator_id)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
  ])

  const notifs = (rawNotifs ?? []) as any[]

  // Fetch comment content separately (avoids FK join issues)
  const commentIds = notifs
    .filter(n => n.comment_id)
    .map(n => n.comment_id as string)

  let commentMap: Record<string, string> = {}
  if (commentIds.length > 0) {
    const { data: comments } = await supabase
      .from('comments')
      .select('id, content')
      .in('id', commentIds)
    for (const c of comments ?? []) {
      commentMap[c.id] = c.content
    }
  }

  const notifications = notifs.map(n => ({
    ...n,
    commentContent: n.comment_id ? (commentMap[n.comment_id] ?? null) : null,
  })) as (NotificationWithDetails & { commentContent: string | null })[]

  const isCreator = (profile as { role: string } | null)?.role === 'creator'
  const unreadCount = notifications.filter(n => !n.read).length

  function buildHref(n: NotificationWithDetails): string {
    if (!n.recipe) return `/creador/${n.actor.id}`
    const recipeId = n.recipe.id
    const comments = '&comments=1'
    switch (n.type) {
      case 'new_recipe':
        return `/creador/${n.actor.id}/feed?start=${recipeId}`
      case 'like':
        return `/perfil/feed?start=${recipeId}`
      case 'comment':
      case 'comment_like':
      case 'comment_reply':
        if (n.recipe.creator_id === user?.id) return `/perfil/feed?start=${recipeId}${comments}`
        return `/creador/${n.recipe.creator_id}/feed?start=${recipeId}${comments}`
      default:
        return `/perfil/feed?start=${recipeId}`
    }
  }

  const showCommentPreview = (type: string) =>
    type === 'comment' || type === 'comment_like' || type === 'comment_reply'

  return (
    <div className="min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <MarkRead />

      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <BackButton fallback="/" />
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--brown-900)' }}>Notificaciones</h1>
          {unreadCount > 0 && (
            <p className="text-xs font-semibold mt-0.5" style={{ color: '#d97706' }}>
              {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--brown-100)', fontSize: '1.75rem' }}>🔔</div>
          <h2 className="font-bold text-base mb-1" style={{ color: 'var(--brown-900)' }}>Sin notificaciones</h2>
          <p className="text-sm" style={{ color: 'var(--brown-500)' }}>
            {isCreator
              ? 'Aquí verás likes, comentarios, nuevos seguidores y nuevas recetas'
              : 'Aquí verás cuando un creador suba una nueva receta o alguien interactúe con tus comentarios'}
          </p>
        </div>
      ) : (
        <div className="mx-5 rounded-3xl overflow-hidden" style={{ border: '1.5px solid var(--brown-100)' }}>
          {notifications.map((n, i) => (
            <Link
              key={n.id}
              href={buildHref(n)}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors active:opacity-70"
              style={{
                background: !n.read ? '#fffbf5' : '#fff',
                borderTop: i > 0 ? '1px solid var(--brown-100)' : 'none',
              }}
            >
              {/* Avatar + badge */}
              <div className="relative flex-shrink-0">
                {n.actor.avatar_url ? (
                  <img src={n.actor.avatar_url} alt="" className="w-11 h-11 rounded-xl object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-black"
                    style={{ background: 'var(--amber)' }}>
                    {n.actor.display_name[0].toUpperCase()}
                  </div>
                )}
                <BadgeIcon type={n.type} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug" style={{ color: 'var(--brown-900)' }}>
                  <span className="font-bold">{n.actor.display_name}</span>
                  {' '}{notifText(n.type)}
                  {n.recipe && (n.type === 'like' || n.type === 'new_recipe') && (
                    <span className="font-semibold"> "{n.recipe.title}"</span>
                  )}
                </p>
                {showCommentPreview(n.type) && n.commentContent && (
                  <p className="text-xs mt-0.5 leading-snug line-clamp-2"
                    style={{ color: 'var(--brown-500)' }}>
                    "{n.commentContent}"
                  </p>
                )}
                <p className="text-xs mt-0.5" style={{ color: 'var(--brown-300)' }}>{timeAgo(n.created_at)}</p>
              </div>

              {/* Thumbnail */}
              {n.recipe?.thumbnail_url && (
                <img src={n.recipe.thumbnail_url} alt="" className="w-10 h-14 rounded-xl object-cover flex-shrink-0" />
              )}

              {/* Unread dot */}
              {!n.read && (
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--amber)' }} />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
