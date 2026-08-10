import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MyRecipeGrid from '@/components/my-recipe-grid'
import VerifiedBadge from '@/components/verified-badge'
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
    <div className="relative min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>

      {/* Settings button — top right */}
      <div className="absolute top-0 right-0 pt-14 pr-5">
        <Link href="/perfil/configuracion"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--brown-100)' }}
          aria-label="Configuración">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="w-4.5 h-4.5" style={{ color: 'var(--brown-500)' }}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </Link>
      </div>

      {/* Header hero */}
      <div className="pt-14 pb-6 px-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name}
                className="w-20 h-20 rounded-full object-cover"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-black text-black"
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

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-sm" style={{ color: 'var(--brown-400)' }}>@{user.username ?? user.display_name}</span>
              {user.role === 'creator' && user.validated_at && <VerifiedBadge size="sm" />}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{
                  background: user.role === 'creator' ? '#fffbeb' : 'var(--brown-100)',
                  color: user.role === 'creator' ? '#92400e' : 'var(--brown-500)',
                  border: `1px solid ${user.role === 'creator' ? '#fcd34d' : 'var(--brown-100)'}`,
                }}>
                {user.role === 'creator' ? '✦ Creador' : 'Consumidor'}
              </span>
            </div>

            {user.bio && (
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--brown-500)' }}>
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Website link */}
        {user.website_url && (
          <div className="mt-3">
            <a href={user.website_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity active:opacity-60"
              style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
              </svg>
              {new URL(user.website_url).hostname.replace('www.', '')}
            </a>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="mx-5 mb-5 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid var(--brown-100)', backdropFilter: 'blur(8px)' }}>
        <div className="grid grid-cols-3">
          <div className="flex flex-col items-center py-3 gap-0.5"
            style={{ borderRight: '1px solid var(--brown-100)' }}>
            <span className="text-[17px] font-black leading-none" style={{ color: 'var(--brown-900)' }}>
              {publishedCount}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'var(--brown-400)' }}>
              Recetas
            </span>
          </div>
          <Link href="/perfil/seguidores"
            className="flex flex-col items-center py-3 gap-0.5 active:opacity-60 transition-opacity"
            style={{ borderRight: '1px solid var(--brown-100)' }}>
            <span className="text-[17px] font-black leading-none" style={{ color: 'var(--brown-900)' }}>
              {followersCount ?? 0}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'var(--brown-400)' }}>
              Seguidores
            </span>
          </Link>
          <Link href="/perfil/siguiendo"
            className="flex flex-col items-center py-3 gap-0.5 active:opacity-60 transition-opacity">
            <span className="text-[17px] font-black leading-none" style={{ color: 'var(--brown-900)' }}>
              {followingCount ?? 0}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'var(--brown-400)' }}>
              Siguiendo
            </span>
          </Link>
        </div>
      </div>

      {/* Recipe grid */}
      <MyRecipeGrid recipes={recipeList} />
    </div>
  )
}
