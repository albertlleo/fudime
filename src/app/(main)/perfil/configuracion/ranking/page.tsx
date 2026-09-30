import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/components/back-button'
import VerifiedBadge from '@/components/verified-badge'

interface RankingRow {
  creator_id: string
  display_name: string
  avatar_url: string | null
  validated_at: string | null
  recipe_count: number
  total_likes: number
  total_saves: number
  score: number
}

const MEDALS = ['🥇', '🥈', '🥉']

function formatScore(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_creator_ranking', { p_limit: 30 })
  const ranking: RankingRow[] = (data ?? []) as RankingRow[]

  const myRankIndex = ranking.findIndex(r => r.creator_id === user.id)

  return (
    <div className="min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <BackButton fallback="/perfil/configuracion" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>Ranking de Creadores</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--brown-400)' }}>
            Top 30 · Puntos = likes + guardados
          </p>
        </div>
      </div>

      {/* Podium top 3 */}
      {ranking.length >= 3 && (
        <div className="px-5 mb-6">
          <div className="flex items-end justify-center gap-3">
            {/* 2nd place */}
            <PodiumCard entry={ranking[1]} rank={2} isSelf={ranking[1].creator_id === user.id} />
            {/* 1st place */}
            <PodiumCard entry={ranking[0]} rank={1} isSelf={ranking[0].creator_id === user.id} />
            {/* 3rd place */}
            <PodiumCard entry={ranking[2]} rank={3} isSelf={ranking[2].creator_id === user.id} />
          </div>
        </div>
      )}

      {/* Rest of ranking (4–30) */}
      {ranking.length > 3 && (
        <div className="mx-5 mb-4">
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            {ranking.slice(3).map((entry, i) => {
              const rank = i + 4
              const isSelf = entry.creator_id === user.id
              const initials = entry.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <Link
                  key={entry.creator_id}
                  href={`/creador/${entry.creator_id}`}
                  className="flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity"
                  style={{
                    borderBottom: i < ranking.length - 4 ? '1px solid var(--brown-100)' : 'none',
                    background: isSelf ? '#fffbeb' : 'transparent',
                  }}
                >
                  {/* Rank */}
                  <span className="w-6 text-center text-sm font-black flex-shrink-0"
                    style={{ color: 'var(--brown-300)' }}>
                    {rank}
                  </span>

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {entry.avatar_url
                      ? <img src={entry.avatar_url} alt={entry.display_name} className="w-10 h-10 rounded-full object-cover" />
                      : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-black"
                          style={{ background: 'var(--amber)' }}>{initials}</div>
                    }
                    {entry.validated_at && (
                      <div className="absolute -bottom-0.5 -right-0.5 rounded-full"
                        style={{ background: '#fff', padding: '1px' }}>
                        <VerifiedBadge size="sm" />
                      </div>
                    )}
                  </div>

                  {/* Name + stats */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: isSelf ? '#92400e' : 'var(--brown-900)' }}>
                      {entry.display_name}{isSelf ? ' (tú)' : ''}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--brown-400)' }}>
                      {entry.recipe_count} receta{entry.recipe_count !== 1 ? 's' : ''} · {formatScore(entry.total_likes)} likes · {formatScore(entry.total_saves)} guardados
                    </p>
                  </div>

                  {/* Score */}
                  <span className="text-sm font-black flex-shrink-0" style={{ color: 'var(--brown-700)' }}>
                    {formatScore(entry.score)}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* My position outside top 30 */}
      {myRankIndex === -1 && (
        <div className="mx-5 mb-4 p-4 rounded-2xl text-center"
          style={{ background: '#fffbeb', border: '1.5px solid #fcd34d' }}>
          <p className="text-sm font-medium" style={{ color: '#92400e' }}>
            Aún no estás en el top 30
          </p>
          <p className="text-xs mt-1" style={{ color: '#d97706' }}>
            Publica recetas y consigue likes y guardados para aparecer aquí
          </p>
        </div>
      )}

      {/* Empty state */}
      {ranking.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--brown-900)' }}>El ranking está vacío</h2>
          <p className="text-sm" style={{ color: 'var(--brown-500)' }}>
            {error ? 'Error al cargar el ranking. Ejecuta la migración en Supabase.' : 'Publica recetas para aparecer aquí'}
          </p>
        </div>
      )}

    </div>
  )
}

function PodiumCard({ entry, rank, isSelf }: { entry: RankingRow; rank: number; isSelf: boolean }) {
  const initials = entry.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-16' }
  const avatarSizes = { 1: 'w-16 h-16', 2: 'w-12 h-12', 3: 'w-12 h-12' }

  return (
    <Link href={`/creador/${entry.creator_id}`}
      className="flex-1 flex flex-col items-center gap-1 active:opacity-70 transition-opacity max-w-[120px]">
      <span className="text-2xl">{MEDALS[rank - 1]}</span>
      <div className="relative">
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={entry.display_name}
              className={`${avatarSizes[rank as 1 | 2 | 3]} rounded-full object-cover`}
              style={isSelf ? { boxShadow: '0 0 0 3px var(--amber)' } : {}} />
          : <div className={`${avatarSizes[rank as 1 | 2 | 3]} rounded-full flex items-center justify-center font-black text-black text-sm`}
              style={{ background: 'var(--amber)', boxShadow: isSelf ? '0 0 0 3px #d97706' : 'none' }}>
              {initials}
            </div>
        }
        {entry.validated_at && (
          <div className="absolute -bottom-0.5 -right-0.5 rounded-full" style={{ background: '#fff', padding: '1px' }}>
            <VerifiedBadge size="sm" />
          </div>
        )}
      </div>
      <p className="text-xs font-bold text-center leading-tight line-clamp-1 px-1"
        style={{ color: isSelf ? '#92400e' : 'var(--brown-900)' }}>
        {entry.display_name}
      </p>
      <div className={`w-full rounded-t-xl flex items-center justify-center ${heights[rank as 1 | 2 | 3]}`}
        style={{ background: rank === 1 ? 'var(--amber)' : '#fff', border: '1.5px solid var(--brown-100)' }}>
        <div className="text-center">
          <p className="text-base font-black" style={{ color: rank === 1 ? '#000' : 'var(--brown-900)' }}>
            {formatScore(entry.score)}
          </p>
          <p className="text-[9px] font-medium" style={{ color: rank === 1 ? 'rgba(0,0,0,0.5)' : 'var(--brown-400)' }}>pts</p>
        </div>
      </div>
    </Link>
  )
}
