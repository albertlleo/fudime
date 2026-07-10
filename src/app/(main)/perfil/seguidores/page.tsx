import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import BackButton from '@/components/back-button'
import VerifiedBadge from '@/components/verified-badge'

export default async function SeguidoresPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from('follows')
    .select('users!follower_id(id, display_name, avatar_url, validated_at)')
    .eq('following_id', authUser!.id)
    .order('created_at', { ascending: false })

  const followers = (rows ?? []).map((r: any) => r.users).filter(Boolean)

  return (
    <div className="min-h-dvh pb-20 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <BackButton fallback="/perfil" />
        <h1 className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>
          Seguidores
          <span className="text-base font-normal ml-2" style={{ color: 'var(--brown-300)' }}>
            {followers.length}
          </span>
        </h1>
      </div>

      {followers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <span className="text-4xl mb-3">👥</span>
          <p className="font-semibold" style={{ color: 'var(--brown-900)' }}>Aún no tienes seguidores</p>
          <p className="text-sm mt-1" style={{ color: 'var(--brown-500)' }}>Publica recetas para que la gente te descubra</p>
        </div>
      ) : (
        <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          {followers.map((u: any, i: number) => {
            const initials = u.display_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
            return (
              <Link key={u.id} href={`/creador/${u.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-stone-50"
                style={i > 0 ? { borderTop: '1px solid var(--brown-100)' } : {}}>
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.display_name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-black flex-shrink-0"
                    style={{ background: 'var(--amber)' }}>{initials}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate" style={{ color: 'var(--brown-900)' }}>
                      {u.display_name}
                    </span>
                    {u.validated_at && <VerifiedBadge />}
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brown-300)' }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
