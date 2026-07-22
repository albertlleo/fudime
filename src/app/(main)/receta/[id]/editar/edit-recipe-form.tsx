'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateRecipe } from './actions'
import type { Recipe } from '@/lib/types'

const CATEGORIES = [
  'Aperitivos', 'Entrantes', 'Ensaladas', 'Cremas y sopas', 'Platos de cuchara',
  'Pasta', 'Arroces', 'Verduras', 'Carne y aves', 'Pescado y marisco',
  'Plant Based', 'Huevos y tortillas', 'Panadería', 'Masas y hojaldres',
  'Comida internacional', 'Comida rápida', 'Bocadillos y sándwiches',
  'Postres y dulces', 'Salsas y aliños', 'Bebidas',
]
const CAT_EMOJIS: Record<string, string> = {
  'Aperitivos': '🥨', 'Entrantes': '🥗', 'Ensaladas': '🥙', 'Cremas y sopas': '🍲',
  'Platos de cuchara': '🫕', 'Pasta': '🍝', 'Arroces': '🍚', 'Verduras': '🥦',
  'Carne y aves': '🍗', 'Pescado y marisco': '🐟', 'Plant Based': '🌿',
  'Huevos y tortillas': '🍳', 'Panadería': '🍞', 'Masas y hojaldres': '🥐',
  'Comida internacional': '🌍', 'Comida rápida': '🍔', 'Bocadillos y sándwiches': '🥪',
  'Postres y dulces': '🍰', 'Salsas y aliños': '🫙', 'Bebidas': '🥤',
}
const DIETS = [
  { key: 'Vegana', emoji: '🌱' }, { key: 'Vegetariana', emoji: '🥕' },
  { key: 'Sin gluten', emoji: '🌾' }, { key: 'Sin lactosa', emoji: '🥛' },
]
const TIMES = [
  { key: 'menos-15', label: 'Menos de 15 min', emoji: '⚡' },
  { key: '15-30', label: '15–30 min', emoji: '🕐' },
  { key: '30-60', label: '30–60 min', emoji: '⏱️' },
  { key: 'mas-1h', label: 'Más de 1 hora', emoji: '🍳' },
]

function normalizeTag(t: string) {
  return CATEGORIES.find(c => c.toLowerCase() === t.toLowerCase()) ?? t
}
function normalizeDiet(d: string) {
  return DIETS.find(x => x.key.toLowerCase() === d.toLowerCase())?.key ?? d
}

function IconGrid({ options, selected, onToggle, single = false }: {
  options: { key: string; label: string; emoji: string }[]
  selected: string[]
  onToggle: (key: string) => void
  single?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(({ key, label, emoji }) => {
        const active = selected.includes(key)
        return (
          <button key={key} type="button" onClick={() => onToggle(key)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all text-left"
            style={{
              background: active ? 'var(--amber)' : '#fff',
              color: active ? '#000' : 'var(--brown-700)',
              border: `1.5px solid ${active ? 'var(--amber)' : 'var(--brown-100)'}`,
            }}>
            <span className="text-lg leading-none flex-shrink-0">{emoji}</span>
            <span className="leading-tight">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function EditRecipeForm({ recipe }: { recipe: Recipe }) {
  const router = useRouter()
  const [title, setTitle] = useState(recipe.title)
  const [description, setDescription] = useState(recipe.description ?? '')
  const [categories, setCategories] = useState<string[]>(
    (recipe.tags ?? []).map(normalizeTag)
  )
  const [diet, setDiet] = useState<string[]>(
    (recipe.diet ?? []).map(normalizeDiet)
  )
  const [cookTime, setCookTime] = useState(recipe.cook_time ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleCategory(c: string) {
    setCategories(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])
  }
  function toggleDiet(d: string) {
    setDiet(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])
  }
  function toggleTime(k: string) {
    setCookTime(p => p === k ? '' : k)
  }

  const canSave = !!title.trim() && categories.length > 0 && !!cookTime && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    const result = await updateRecipe(recipe.id, {
      title,
      description,
      tags: categories.map(c => c.toLowerCase()),
      diet: diet.map(d => d.toLowerCase()),
      cookTime: cookTime || null,
    })
    if (result.error) {
      setError(result.error)
      setSaving(false)
    } else {
      router.back()
    }
  }

  return (
    <div className="px-5 space-y-5">
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
          Título <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          maxLength={80} placeholder="¿Qué receta es?" className="input-cream" />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
          Ingredientes y paso a paso
        </label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          rows={6} placeholder="Lista de ingredientes, pasos de la receta, trucos..."
          className="input-cream resize-none" />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-700)' }}>
          Categoría <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <IconGrid
          options={CATEGORIES.map(c => ({ key: c, label: c, emoji: CAT_EMOJIS[c] ?? '🍴' }))}
          selected={categories}
          onToggle={toggleCategory}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-700)' }}>
          Tiempo de cocinado <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <IconGrid
          options={TIMES.map(t => ({ key: t.key, label: t.label, emoji: t.emoji }))}
          selected={cookTime ? [cookTime] : []}
          onToggle={toggleTime}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-700)' }}>
          Dieta e intolerancias <span className="font-normal ml-1" style={{ color: 'var(--brown-300)' }}>(opcional)</span>
        </label>
        <IconGrid
          options={DIETS.map(d => ({ key: d.key, label: d.key, emoji: d.emoji }))}
          selected={diet}
          onToggle={toggleDiet}
        />
      </div>

      {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}

      <div className="flex gap-3 pt-2 pb-8">
        <button type="button" onClick={() => router.back()}
          className="flex-1 font-medium rounded-2xl py-3.5 text-sm"
          style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }}>
          Cancelar
        </button>
        <button type="button" onClick={handleSave} disabled={!canSave}
          className="flex-1 font-semibold rounded-2xl py-3.5 text-sm"
          style={{ background: 'var(--amber)', color: '#000', opacity: !canSave ? 0.4 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
