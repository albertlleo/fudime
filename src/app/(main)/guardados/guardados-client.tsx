'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { RecipeWithCreator } from '@/lib/types'

type Tab = 'todas' | 'categoria' | 'creador'

const CAT_EMOJIS: Record<string, string> = {
  'aperitivos': '🥨', 'entrantes': '🥗', 'ensaladas': '🥙', 'cremas y sopas': '🍲',
  'platos de cuchara': '🫕', 'pasta': '🍝', 'arroces': '🍚', 'verduras': '🥦',
  'carne y aves': '🍗', 'pescado y marisco': '🐟', 'proteínas vegetales': '🌿', 'plant based': '🌿',
  'huevos y tortillas': '🍳', 'panadería': '🍞', 'masas y hojaldres': '🥐',
  'comida internacional': '🌍', 'comida rápida': '🍔', 'bocadillos y sándwiches': '🥪',
  'postres y dulces': '🍰', 'salsas y aliños': '🫙', 'bebidas': '🥤',
}

function RecipeThumb({ recipe }: { recipe: RecipeWithCreator }) {
  return (
    <Link href={`/receta/${recipe.id}`} className="block">
      <div className="relative aspect-[3/4] bg-stone-900 overflow-hidden">
        {recipe.thumbnail_url ? (
          <img src={recipe.thumbnail_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🍴</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="text-white text-[10px] font-semibold line-clamp-2 leading-tight">{recipe.title}</p>
        </div>
      </div>
    </Link>
  )
}

function CategoryCard({ cat, recipes }: { cat: string; recipes: RecipeWithCreator[] }) {
  const cover = recipes[0]
  const emoji = CAT_EMOJIS[cat.toLowerCase()] ?? '🍴'
  return (
    <Link href={`/guardados/categoria/${encodeURIComponent(cat)}`} className="block">
      <div className="relative aspect-[3/4] bg-stone-900 overflow-hidden">
        {cover?.thumbnail_url ? (
          <img src={cover.thumbnail_url} alt={cat} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl"
            style={{ background: 'var(--brown-100)' }}>
            {emoji}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2.5 pt-8 pb-2.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm leading-none">{emoji}</span>
            <p className="text-white text-xs font-bold capitalize line-clamp-1">{cat}</p>
          </div>
          <p className="text-white/60 text-[10px]">{recipes.length} receta{recipes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </Link>
  )
}

function CreatorSection({ title, recipes }: { title: string; recipes: RecipeWithCreator[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-5">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold" style={{ color: 'var(--brown-900)' }}>{title}</p>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'var(--brown-100)', color: 'var(--brown-500)' }}>
            {recipes.length}
          </span>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--brown-300)' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="grid grid-cols-3 gap-0.5 px-0.5">
          {recipes.map(r => <RecipeThumb key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  )
}

export default function GuardadosClient({ recipes }: { recipes: RecipeWithCreator[] }) {
  const [tab, setTab] = useState<Tab>('todas')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return recipes
    const q = query.toLowerCase()
    return recipes.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.users.display_name.toLowerCase().includes(q)
    )
  }, [recipes, query])

  const byCategory = useMemo(() => {
    const map: Record<string, RecipeWithCreator[]> = {}
    for (const r of filtered) {
      const tags = r.tags?.length ? r.tags : ['Sin categoría']
      for (const tag of tags) {
        if (!map[tag]) map[tag] = []
        map[tag].push(r)
      }
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length)
  }, [filtered])

  const byCreator = useMemo(() => {
    const map: Record<string, { name: string; recipes: RecipeWithCreator[] }> = {}
    for (const r of filtered) {
      const id = r.users.id
      if (!map[id]) map[id] = { name: r.users.display_name, recipes: [] }
      map[id].recipes.push(r)
    }
    return Object.entries(map).sort((a, b) => b[1].recipes.length - a[1].recipes.length)
  }, [filtered])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'creador', label: 'Creador' },
  ]

  return (
    <div className="h-dvh overflow-y-auto pb-20" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-black mb-4" style={{ color: 'var(--brown-900)' }}>Guardados</h1>

        {/* Search */}
        <div className="relative mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--brown-300)' }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="search" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar receta guardada..." className="input-cream pl-10" />
        </div>

        {/* Tabs */}
        {recipes.length > 0 && (
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--brown-100)' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all"
                style={{
                  background: tab === t.key ? '#fff' : 'transparent',
                  color: tab === t.key ? 'var(--brown-900)' : 'var(--brown-500)',
                  boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <span className="text-5xl mb-4">🔖</span>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--brown-900)' }}>Nada guardado aún</h2>
          <p className="text-sm" style={{ color: 'var(--brown-500)' }}>Guarda recetas del feed pulsando el marcador</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-sm" style={{ color: 'var(--brown-500)' }}>No hay recetas guardadas con "{query}"</p>
        </div>
      ) : tab === 'todas' ? (
        <div className="grid grid-cols-2 gap-0.5 px-0.5">
          {filtered.map(r => <RecipeThumb key={r.id} recipe={r} />)}
        </div>
      ) : tab === 'categoria' ? (
        <div className="grid grid-cols-2 gap-0.5 px-0.5">
          {byCategory.map(([cat, recs]) => (
            <CategoryCard key={cat} cat={cat} recipes={recs} />
          ))}
        </div>
      ) : (
        <div>
          {byCreator.map(([id, { name, recipes: recs }]) => (
            <CreatorSection key={id} title={name} recipes={recs} />
          ))}
        </div>
      )}
    </div>
  )
}
