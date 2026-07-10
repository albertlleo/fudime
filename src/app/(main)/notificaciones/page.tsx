import { createClient } from '@/lib/supabase/server'
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

function notifText(n: NotificationWithDetails): string {
  switch (n.type) {
    case 'like': return 'dio like a tu receta'
    case 'follow': return 'empezó a seguirte'
    case 'comment': return 'comentó en tu receta'
  }
}

function notifIcon(type: string) {
  if (type === 'like') return { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626', label: '♥' }
  if (type === 'follow') return { bg: '#fffbeb', border: '#fcd34d', color: '#d97706', label: '+' }
  return { bg: '#f5f3ff', border: '#c4b5fd', color: '#7c3aed', label: '💬' }
}

export default async function NotificacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let notifications: NotificationWithDetails[] = []
  try {
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:users!actor_id(id, display_name, avatar_url), recipe:recipes!recipe_id(id, title, thumbnail_url)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50)
    notifications = (data ?? []) as NotificationWithDetails[]
  } catch {}

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-dvh pb-20 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <MarkRead />

      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <BackButton fallback="/perfil" />
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
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
            style={{ background: 'var(--brown-100)' }}>🔔</div>
          <h2 className="font-bold text-base mb-1" style={{ color: 'var(--brown-900)' }}>Sin notificaciones</h2>
          <p className="text-sm" style={{ color: 'var(--brown-500)' }}>Aquí aparecerán tus likes, comentarios y nuevos seguidores</p>
        </div>
      ) : (
        <div className="mx-5 rounded-3xl overflow-hidden" style={{ border: '1.5px solid var(--brown-100)' }}>
          {notifications.map((n, i) => {
            const icon = notifIcon(n.type)
            return (
              <Link
                key={n.id}
                href={n.recipe ? `/receta/${n.recipe.id}` : `/creador/${n.actor.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors"
                style={{
                  background: !n.read ? '#fffbf5' : '#fff',
                  borderTop: i > 0 ? '1px solid var(--brown-100)' : 'none',
                }}
              >
                {/* Actor avatar + type badge */}
                <div className="relative flex-shrink-0">
                  {n.actor.avatar_url ? (
                    <img src={n.actor.avatar_url} alt="" className="w-11 h-11 rounded-xl object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-black"
                      style={{ background: 'var(--amber)' }}>
                      {n.actor.display_name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: icon.bg, border: `1.5px solid ${icon.border}`, color: icon.color }}>
                    {icon.label}
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug" style={{ color: 'var(--brown-900)' }}>
                    <span className="font-bold">{n.actor.display_name}</span>
                    {' '}{notifText(n)}
                    {n.recipe && <span className="font-semibold"> "{n.recipe.title}"</span>}
                  </p>
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
            )
          })}
        </div>
      )}
    </div>
  )
}
