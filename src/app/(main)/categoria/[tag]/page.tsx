import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RecipeGrid from '@/components/recipe-grid'
import type { RecipeWithCreator } from '@/lib/types'

const TAG_EMOJIS: Record<string, string> = {
  pasta: '🍝', pollo: '🍗', vegano: '🥗', postre: '🍰', rápido: '⚡',
  ensalada: '🥙', arroz: '🍚', sopas: '🍲', snacks: '🍿', smoothie: '🥤',
}

export default async function CategoriaPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const supabase = await createClient()

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*, users!creator_id(id, display_name, avatar_url, validated_at)')
    .eq('status', 'published')
    .contains('tags', [decoded])
    .order('likes_count', { ascending: false })
    .limit(40)

  const list = (recipes ?? []) as RecipeWithCreator[]
  const emoji = TAG_EMOJIS[decoded] ?? '🍴'

  return (
    <div className="min-h-dvh pb-20 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-5">
        <Link href="/buscar"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors"
          style={{ color: 'var(--brown-500)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Buscar
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            {emoji}
          </div>
          <div>
            <h1 className="text-2xl font-black capitalize" style={{ color: 'var(--brown-900)' }}>
              #{decoded}
            </h1>
            <p className="text-sm" style={{ color: 'var(--brown-500)' }}>
              {list.length} receta{list.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <RecipeGrid
        recipes={list}
        emptyIcon="🏷️"
        emptyTitle="Sin recetas"
        emptyText={`Nadie ha publicado recetas con #${decoded} todavía`}
      />
    </div>
  )
}
