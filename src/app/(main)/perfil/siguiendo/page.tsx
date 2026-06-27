import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SiguiendoPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from('follows')
    .select('users!following_id(id, display_name, avatar_url, validated_at)')
    .eq('follower_id', authUser!.id)
    .order('created_at', { ascending: false })

  const following = (rows ?? []).map((r: any) => r.users).filter(Boolean)

  return (
    <div className="min-h-dvh pb-16 overflow-y-auto">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <Link href="/perfil" className="text-stone-500 hover:text-stone-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-stone-900">Siguiendo <span className="text-stone-400 font-normal text-base">({following.length})</span></h1>
      </div>

      {following.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-stone-900 font-semibold">Aún no sigues a nadie</p>
          <p className="text-stone-400 text-sm mt-1">Explora el feed y sigue a los creadores que más te gusten</p>
          <Link href="/buscar" className="mt-4 px-5 py-2.5 bg-amber-500 text-black font-semibold rounded-xl text-sm">
            Explorar creadores
          </Link>
        </div>
      ) : (
        <div className="bg-white mx-4 rounded-2xl divide-y divide-stone-100 shadow-sm">
          {following.map((u: any) => {
            const initials = u.display_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
            return (
              <Link key={u.id} href={`/creador/${u.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.display_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-900 font-medium text-sm">{u.display_name}</span>
                    {u.validated_at && (
                      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
                        <circle cx="12" cy="12" r="12" fill="#F59E0B" />
                        <path d="M7 12.5l3.5 3.5 6.5-7" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-stone-300 flex-shrink-0">
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
