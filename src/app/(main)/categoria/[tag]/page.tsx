import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RecipeGrid from '@/components/recipe-grid'
import type { RecipeWithCreator } from '@/lib/types'

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

  return (
    <div className="min-h-dvh pb-16 overflow-y-auto">
      <div className="px-4 pt-12 pb-2">
        <Link href="/buscar" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm transition-colors mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Buscar
        </Link>
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold text-stone-900">#{decoded}</h1>
          <span className="text-stone-400 text-sm">{list.length} receta{list.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="pt-3">
        <RecipeGrid
          recipes={list}
          emptyIcon="🏷️"
          emptyTitle="Sin recetas"
          emptyText={`Nadie ha publicado recetas con #${decoded} todavía`}
        />
      </div>
    </div>
  )
}
