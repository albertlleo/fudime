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

  const [{ count: savesCount }, { count: likesCount }, { data: recipes }] = await Promise.all([
    supabase.from('saves').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('recipes').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
  ])

  const recipeList = (recipes ?? []) as Recipe[]
  const publishedCount = recipeList.filter(r => r.status === 'published').length

  const initials = user.display_name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-dvh pb-16 overflow-y-auto">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 flex flex-col items-center text-center">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.display_name}
            className="w-24 h-24 rounded-full object-cover mb-4 ring-2 ring-stone-300"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-amber-500 flex items-center justify-center mb-4 text-2xl font-bold text-black">
            {initials}
          </div>
        )}

        <div className="flex items-center gap-2 mt-0">
          <h1 className="text-xl font-bold text-stone-900">{user.display_name}</h1>
          <a href="/perfil/editar" className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors flex-shrink-0" aria-label="Editar perfil">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-stone-500">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </a>
        </div>

        <span className={`mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.role === 'creator'
            ? 'bg-amber-500/20 text-amber-600'
            : 'bg-stone-100 text-stone-500'
        }`}>
          {user.role === 'creator' ? 'Creador' : 'Consumidor'}
        </span>

        {user.bio && (
          <p className="mt-3 text-stone-500 text-sm leading-relaxed max-w-xs">{user.bio}</p>
        )}

        {(user.instagram_url || user.tiktok_url) && (
          <div className="flex gap-3 mt-3">
            {user.instagram_url && (
              <a href={user.instagram_url} target="_blank" rel="noopener noreferrer"
                className="text-stone-500 hover:text-stone-700 transition-colors text-xs flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                Instagram
              </a>
            )}
            {user.tiktok_url && (
              <a href={user.tiktok_url} target="_blank" rel="noopener noreferrer"
                className="text-stone-500 hover:text-stone-700 transition-colors text-xs flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                </svg>
                TikTok
              </a>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mx-6 bg-white rounded-2xl p-4 grid grid-cols-3 divide-x divide-stone-200 mb-6 shadow-sm">
        <div className="flex flex-col items-center px-2">
          <span className="text-stone-900 font-bold text-lg">{savesCount ?? 0}</span>
          <span className="text-stone-500 text-xs mt-0.5">Guardados</span>
        </div>
        <div className="flex flex-col items-center px-2">
          <span className="text-stone-900 font-bold text-lg">{likesCount ?? 0}</span>
          <span className="text-stone-500 text-xs mt-0.5">Likes</span>
        </div>
        <div className="flex flex-col items-center px-2">
          <span className="text-stone-900 font-bold text-lg">{publishedCount}</span>
          <span className="text-stone-500 text-xs mt-0.5">Recetas</span>
        </div>
      </div>

      <MyRecipeGrid recipes={recipeList} />

      {/* Notifications link */}
      <div className="mx-6 mb-4">
        {authUser?.email === process.env.ADMIN_EMAIL && (
          <Link
            href="/admin"
            className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 mb-3 hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-600">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-amber-700 text-sm font-semibold">Panel Admin</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-500">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        )}
      </div>

      {/* Notifications block */}
      <div className="mx-6 mb-4">
        <Link
          href="/notificaciones"
          className="flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-stone-500">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="text-stone-700 text-sm font-medium">Notificaciones</span>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-stone-400">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>

      {/* Account info */}
      <div className="mx-6 bg-white rounded-2xl divide-y divide-stone-200 mb-6 shadow-sm">
        <div className="px-4 py-3 flex justify-between items-center">
          <span className="text-stone-500 text-sm">Email</span>
          <span className="text-stone-700 text-sm">{user.email}</span>
        </div>
        {user.role === 'creator' && (
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-stone-500 text-sm">Cuenta validada</span>
            <span className={`text-sm font-medium ${user.validated_at ? 'text-green-600' : 'text-amber-500'}`}>
              {user.validated_at ? 'Sí' : 'Pendiente'}
            </span>
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="mx-6 mb-6">
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full bg-white hover:bg-stone-50 border border-stone-200 text-red-500 font-medium rounded-2xl py-3 text-sm transition-colors shadow-sm"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
