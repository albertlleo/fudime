'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/components/back-button'
import { addToFolder, removeFromFolder } from './actions'
import type { RecipeWithCreator, Folder } from '@/lib/types'
import { DIETS } from '@/lib/categories'

export default function FolderClient({
  folder,
  recipesInFolder,
  recipesNotInFolder,
}: {
  folder: Folder
  recipesInFolder: RecipeWithCreator[]
  recipesNotInFolder: RecipeWithCreator[]
}) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [query, setQuery] = useState('')
  const [filterDiet, setFilterDiet] = useState('')
  const [isPending, startTransition] = useTransition()

  const hasActiveFilter = !!filterDiet

  const filteredRecipes = useMemo(() => {
    let r = recipesInFolder
    if (query.trim()) {
      const q = query.toLowerCase()
      r = r.filter(recipe => recipe.title.toLowerCase().includes(q) || recipe.users.display_name.toLowerCase().includes(q))
    }
    if (filterDiet) {
      r = r.filter(recipe => recipe.diet?.includes(filterDiet))
    }
    return r
  }, [recipesInFolder, query, filterDiet])

  function handleRemove(recipeId: string) {
    startTransition(async () => {
      await removeFromFolder(recipeId, folder.id)
      router.refresh()
    })
  }

  function handleAdd(recipeId: string) {
    startTransition(async () => {
      await addToFolder(recipeId, folder.id)
      router.refresh()
    })
  }

  return (
    <div className="min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallback="/perfil" />
          <div>
            <h1 className="text-xl font-black leading-tight" style={{ color: 'var(--brown-900)' }}>
              {folder.name}
            </h1>
            <p className="text-xs" style={{ color: 'var(--brown-400)' }}>
              {filteredRecipes.length} receta{filteredRecipes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {recipesNotInFolder.length > 0 && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold active:opacity-70"
              style={{ background: 'var(--amber)', color: '#000' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Añadir
            </button>
          )}
          {recipesInFolder.length > 0 && (
            <button onClick={() => setEditMode(e => !e)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold active:opacity-70"
              style={{
                background: editMode ? 'var(--brown-900)' : 'var(--brown-100)',
                color: editMode ? '#fff' : 'var(--brown-600)',
              }}>
              {editMode ? 'Hecho' : 'Editar'}
            </button>
          )}
        </div>
      </div>

      {/* Search + filter */}
      {recipesInFolder.length > 0 && (
        <div className="px-5 pb-4 flex gap-2">
          <div className="flex-1">
            <input type="search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar en esta carpeta..." className="input-cream" />
          </div>
          <button
            onClick={() => setShowFilter(true)}
            className="w-11 flex-shrink-0 rounded-2xl flex items-center justify-center transition-colors"
            style={{
              background: hasActiveFilter ? 'var(--amber)' : '#fff',
              border: '1.5px solid var(--brown-100)',
              color: hasActiveFilter ? '#000' : 'var(--brown-500)',
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Recipe grid */}
      {recipesInFolder.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center px-8">
          <div className="text-4xl mb-3">📁</div>
          <p className="font-semibold text-sm" style={{ color: 'var(--brown-700)' }}>Esta carpeta está vacía</p>
          <p className="text-xs mt-1" style={{ color: 'var(--brown-400)' }}>
            Toca "Añadir" para agregar recetas guardadas
          </p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center px-8">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold text-sm" style={{ color: 'var(--brown-700)' }}>Sin resultados</p>
        </div>
      ) : (
        <div className="px-0.5 grid grid-cols-3 gap-0.5">
          {filteredRecipes.map(recipe => (
            <div key={recipe.id} className="relative">
              <Link href={`/perfil/feed?start=${recipe.id}`}
                className="block overflow-hidden"
                style={{ pointerEvents: editMode ? 'none' : 'auto' }}>
                <div className="relative aspect-[3/4]" style={{ background: 'var(--brown-100)' }}>
                  {recipe.thumbnail_url && (
                    <img src={recipe.thumbnail_url} alt={recipe.title}
                      className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <p className="text-white text-[9px] font-semibold line-clamp-1 leading-tight uppercase">{recipe.title}</p>
                  </div>
                </div>
              </Link>
              {editMode && (
                <button
                  onClick={() => handleRemove(recipe.id)}
                  disabled={isPending}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: '#dc2626' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filter backdrop */}
      <div className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.45)', opacity: showFilter ? 1 : 0, pointerEvents: showFilter ? 'auto' : 'none' }}
        onClick={() => setShowFilter(false)} />

      {/* Filter sheet */}
      <div className="fixed inset-0 z-[70] pointer-events-none">
        <div className="h-full lg:pl-[72px] lg:flex lg:justify-center">
          <div className="w-full lg:max-w-[500px] h-full relative">
            <div className="absolute left-0 right-0 bottom-0 pointer-events-auto transition-transform duration-300 ease-out"
              style={{
                background: 'var(--cream)', borderRadius: '20px 20px 0 0',
                transform: showFilter ? 'translateY(0)' : 'translateY(100%)',
                paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 16px))',
              }}>
              <div className="px-5 pt-4 pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full" style={{ background: 'var(--brown-300)' }} />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-base" style={{ color: 'var(--brown-900)' }}>Filtrar</h3>
                  {hasActiveFilter && (
                    <button onClick={() => setFilterDiet('')}
                      className="text-xs font-semibold" style={{ color: 'var(--terracotta)' }}>
                      Limpiar
                    </button>
                  )}
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>
                  Dieta
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIETS.map(d => (
                    <button key={d.key}
                      onClick={() => { setFilterDiet(filterDiet === d.key ? '' : d.key); setShowFilter(false) }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-semibold transition-colors"
                      style={{
                        background: filterDiet === d.key ? 'var(--amber)' : '#fff',
                        border: '1.5px solid var(--brown-100)',
                        color: 'var(--brown-800)',
                      }}>
                      <span>{d.emoji}</span>
                      <span>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop add sheet */}
      <div className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.45)', opacity: showAdd ? 1 : 0, pointerEvents: showAdd ? 'auto' : 'none' }}
        onClick={() => setShowAdd(false)} />

      {/* Add recipes sheet */}
      <div className="fixed inset-0 z-[70] pointer-events-none">
        <div className="h-full lg:pl-[72px] lg:flex lg:justify-center">
          <div className="w-full lg:max-w-[500px] h-full relative">
            <div className="absolute left-0 right-0 bottom-0 pointer-events-auto transition-transform duration-300 ease-out overflow-y-auto"
              style={{ background: 'var(--cream)', borderRadius: '20px 20px 0 0',
                transform: showAdd ? 'translateY(0)' : 'translateY(100%)',
                maxHeight: '85dvh' }}>
              <div className="px-5 pt-4" style={{ paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 16px))' }}>
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full" style={{ background: 'var(--brown-300)' }} />
                </div>
                <h3 className="font-black text-base mb-4" style={{ color: 'var(--brown-900)' }}>
                  Añadir a {folder.name}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {recipesNotInFolder.map(recipe => (
                    <button key={recipe.id} onClick={() => { handleAdd(recipe.id); setShowAdd(false) }}
                      disabled={isPending}
                      className="rounded-xl overflow-hidden text-left active:opacity-70 transition-opacity">
                      <div className="relative" style={{ paddingTop: '133%', background: 'var(--brown-100)' }}>
                        {recipe.thumbnail_url && (
                          <img src={recipe.thumbnail_url} alt={recipe.title}
                            className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                          <p className="text-white text-[10px] font-semibold line-clamp-2 leading-tight">{recipe.title}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
