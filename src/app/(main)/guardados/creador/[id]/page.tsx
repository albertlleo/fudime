import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RecipeGrid from '@/components/recipe-grid'
import BackButton from '@/components/back-button'
import VerifiedBadge from '@/components/verified-badge'
import type { RecipeWithCreator } from '@/lib/types'

export default async function GuardadosCreadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [saveRows, creatorResult] = await Promise.all([
    supabase.from('saves').select('recipe_id').eq('user_id', user.id),
    supabase.from('users').select('id, display_name, avatar_url, validated_at').eq('id', id).single(),
  ])

  const creator = creatorResult.data
  if (!creator) notFound()

  const savedIds = (saveRows.data ?? []).map((s: { recipe_id: string }) => s.recipe_id)

  const { data: recipes } = savedIds.length > 0
    ? await supabase
        .from('recipes')
        .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
        .in('id', savedIds)
        .eq('creator_id', id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
    : { data: [] }

  const list = (recipes ?? []) as RecipeWithCreator[]
  const initials = creator.display_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="min-h-dvh pb-20 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-5">
        <div className="mb-5">
          <BackButton fallback="/guardados" />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {creator.avatar_url
              ? <img src={creator.avatar_url} alt={creator.display_name} className="w-16 h-16 rounded-full object-cover" />
              : <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-black"
                  style={{ background: 'var(--amber)' }}>{initials}</div>
            }
            {creator.validated_at && (
              <div className="absolute -bottom-0.5 -right-0.5 rounded-full"
                style={{ background: 'var(--cream)', padding: '1.5px' }}>
                <VerifiedBadge size="md" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--brown-900)' }}>
              @{creator.display_name}
            </h1>
            <p className="text-sm" style={{ color: 'var(--brown-500)' }}>
              {list.length} guardada{list.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <RecipeGrid
        recipes={list}
        emptyIcon="🔖"
        emptyTitle="Sin recetas guardadas"
        emptyText={`No tienes recetas guardadas de @${creator.display_name}`}
      />
    </div>
  )
}
