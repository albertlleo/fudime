import { createClient } from '@/lib/supabase/server'
import RecipeGrid from '@/components/recipe-grid'
import BackButton from '@/components/back-button'
import type { RecipeWithCreator } from '@/lib/types'

const CAT_EMOJIS: Record<string, string> = {
  'aperitivos': '🥨', 'entrantes': '🥗', 'ensaladas': '🥙', 'cremas y sopas': '🍲',
  'platos de cuchara': '🫕', 'pasta': '🍝', 'arroces': '🍚', 'verduras': '🥦',
  'carne y aves': '🍗', 'pescado y marisco': '🐟', 'proteínas vegetales': '🌿', 'plant based': '🌿',
  'huevos y tortillas': '🍳', 'panadería': '🍞', 'masas y hojaldres': '🥐',
  'comida internacional': '🌍', 'comida rápida': '🍔', 'bocadillos y sándwiches': '🥪',
  'postres y dulces': '🍰', 'salsas y aliños': '🫙', 'bebidas': '🥤',
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
  const emoji = CAT_EMOJIS[decoded.toLowerCase()] ?? '🍴'

  return (
    <div className="min-h-dvh pb-20 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-5">
        <div className="flex items-center gap-3 mb-5">
          <BackButton fallback="/chefs" />
        </div>

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
