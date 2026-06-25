import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MarkRead from './mark-read'
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
    case 'like': return `dio like a tu receta`
    case 'follow': return `empezó a seguirte`
    case 'comment': return `comentó en tu receta`
  }
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

  const unread = notifications.filter(n => !n.read)

  return (
    <div className="min-h-dvh pb-16 overflow-y-auto">
      <MarkRead />

      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <Link href="/perfil" className="w-9 h-9 flex-shrink-0 bg-stone-100 hover:bg-stone-200 rounded-full flex items-center justify-center transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-stone-600">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-stone-900">Notificaciones</h1>
          {unread.length > 0 && (
            <p className="text-amber-600 text-xs font-medium">{unread.length} nueva{unread.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <span className="text-4xl mb-3">🔔</span>
          <p className="text-stone-500 text-sm">No tienes notificaciones aún</p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {notifications.map(n => (
            <Link
              key={n.id}
              href={n.recipe ? `/receta/${n.recipe.id}` : `/creador/${n.actor.id}`}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 transition-colors ${!n.read ? 'bg-amber-50/50' : ''}`}
            >
              {/* Actor avatar */}
              <div className="relative flex-shrink-0">
                {n.actor.avatar_url ? (
                  <img src={n.actor.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-sm">
                    {n.actor.display_name[0].toUpperCase()}
                  </div>
                )}
                {/* Type icon */}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] ${
                  n.type === 'like' ? 'bg-red-500' : n.type === 'follow' ? 'bg-amber-500' : 'bg-stone-700'
                }`}>
                  {n.type === 'like' ? '♥' : n.type === 'follow' ? '+' : '💬'}
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-stone-900 text-sm leading-snug">
                  <span className="font-semibold">{n.actor.display_name}</span>
                  {' '}{notifText(n)}
                  {n.recipe && <span className="font-medium"> "{n.recipe.title}"</span>}
                </p>
                <p className="text-stone-400 text-xs mt-0.5">{timeAgo(n.created_at)}</p>
              </div>

              {/* Recipe thumbnail */}
              {n.recipe?.thumbnail_url && (
                <img src={n.recipe.thumbnail_url} alt="" className="w-10 h-14 rounded-lg object-cover flex-shrink-0" />
              )}

              {/* Unread dot */}
              {!n.read && <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
