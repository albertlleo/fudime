import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { signOutAction } from './actions'
import MyRecipeGrid from '@/components/my-recipe-grid'
import type { User, Recipe } from '@/lib/types'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser!.id)
    .single()

  const user = profile as User

  const [{ data: recipes }, { count: followersCount }, { count: followingCount }] = await Promise.all([
    supabase.from('recipes').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
  ])

  const recipeList = (recipes ?? []) as Recipe[]
  const publishedCount = recipeList.filter(r => r.status === 'published').length

  const initials = user.display_name
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="min-h-dvh pb-20 overflow-y-auto" style={{ background: 'var(--cream)' }}>

      {/* Header hero */}
      <div className="pt-14 pb-6 px-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name}
                className="w-20 h-20 rounded-2xl object-cover"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-black text-black"
                style={{ background: 'var(--amber)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
                {initials}
              </div>
            )}
          </div>

          {/* Name + edit */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black leading-tight truncate" style={{ color: 'var(--brown-900)' }}>
                {user.display_name}
              </h1>
              <a href="/perfil/editar"
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'var(--brown-100)' }}
                aria-label="Editar perfil">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  className="w-3.5 h-3.5" style={{ color: 'var(--brown-500)' }}>
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </a>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: user.role === 'creator' ? '#fffbeb' : 'var(--brown-100)',
                  color: user.role === 'creator' ? '#92400e' : 'var(--brown-500)',
                  border: `1px solid ${user.role === 'creator' ? '#fcd34d' : 'var(--brown-100)'}`,
                }}>
                {user.role === 'creator' ? '✦ Creador' : 'Consumidor'}
              </span>
              {user.role === 'creator' && (
                <span className="text-xs" style={{ color: user.validated_at ? '#16a34a' : 'var(--brown-500)' }}>
                  {user.validated_at ? '✓ Verificado' : '· Pendiente'}
                </span>
              )}
            </div>

            {user.bio && (
              <p className="mt-2 text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--brown-500)' }}>
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Social links */}
        {(user.instagram_url || user.tiktok_url) && (
          <div className="flex gap-2 mt-4">
            {user.instagram_url && (
              <a href={user.instagram_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                Instagram
              </a>
            )}
            {user.tiktok_url && (
              <a href={user.tiktok_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }}>
                TikTok
              </a>
            )}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="mx-5 rounded-2xl overflow-hidden mb-6"
        style={{ background: '#fff', border: '1.5px solid var(--brown-100)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'var(--brown-100)' }}>
          <div className="flex flex-col items-center py-4">
            <span className="text-2xl font-black" style={{ color: 'var(--brown-900)' }}>{publishedCount}</span>
            <span className="text-xs font-medium mt-0.5" style={{ color: 'var(--brown-500)' }}>Recetas</span>
          </div>
          <Link href="/perfil/seguidores" className="flex flex-col items-center py-4 transition-opacity hover:opacity-70">
            <span className="text-2xl font-black" style={{ color: 'var(--brown-900)' }}>{followersCount ?? 0}</span>
            <span className="text-xs font-medium mt-0.5" style={{ color: 'var(--brown-500)' }}>Seguidores</span>
          </Link>
          <Link href="/perfil/siguiendo" className="flex flex-col items-center py-4 transition-opacity hover:opacity-70">
            <span className="text-2xl font-black" style={{ color: 'var(--brown-900)' }}>{followingCount ?? 0}</span>
            <span className="text-xs font-medium mt-0.5" style={{ color: 'var(--brown-500)' }}>Siguiendo</span>
          </Link>
        </div>
      </div>

      {/* Recipe grid */}
      <MyRecipeGrid recipes={recipeList} />

      {/* Admin link */}
      {authUser?.email === process.env.ADMIN_EMAIL && (
        <div className="mx-5 mb-3">
          <Link href="/admin"
            className="flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors"
            style={{ background: '#fffbeb', border: '1.5px solid #fcd34d' }}>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                className="w-5 h-5" style={{ color: '#d97706' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-sm font-semibold" style={{ color: '#92400e' }}>Panel Admin</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4" style={{ color: '#d97706' }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
      )}

      {/* Notifications */}
      <div className="mx-5 mb-3">
        <Link href="/notificaciones"
          className="flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors"
          style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5" style={{ color: 'var(--brown-500)' }}>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="text-sm font-medium" style={{ color: 'var(--brown-700)' }}>Notificaciones</span>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4" style={{ color: 'var(--brown-300)' }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>

      {/* Account info */}
      <div className="mx-5 rounded-2xl overflow-hidden mb-4"
        style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
        <div className="px-4 py-3 flex justify-between items-center"
          style={{ borderBottom: '1px solid var(--brown-100)' }}>
          <span className="text-sm" style={{ color: 'var(--brown-500)' }}>Email</span>
          <span className="text-sm truncate max-w-[200px]" style={{ color: 'var(--brown-700)' }}>{user.email}</span>
        </div>
        <div className="px-4 py-3 flex justify-between items-center">
          <span className="text-sm" style={{ color: 'var(--brown-500)' }}>Rol</span>
          <span className="text-sm font-medium" style={{ color: 'var(--brown-700)' }}>
            {user.role === 'creator' ? 'Creador' : 'Consumidor'}
          </span>
        </div>
      </div>

      {/* Sign out */}
      <div className="mx-5 mb-8">
        <form action={signOutAction}>
          <button type="submit"
            className="w-full font-medium rounded-2xl py-3.5 text-sm transition-colors"
            style={{ background: '#fff', border: '1.5px solid #fca5a5', color: '#dc2626' }}>
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
