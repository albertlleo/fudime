'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createFolder, deleteFolder } from './actions'
import VerifiedBadge from '@/components/verified-badge'
import type { User } from '@/lib/types'

export interface FolderInfo {
  id: string
  name: string
  count: number
  cover: string | null
}

export default function ConsumerProfile({
  user,
  followingCount,
  folders: initialFolders,
}: {
  user: User
  followingCount: number
  folders: FolderInfo[]
}) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [editMode, setEditMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = user.display_name
    .split(' ').map(w => w[0] ?? '').filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'

  useEffect(() => {
    if (showCreate) setTimeout(() => inputRef.current?.focus(), 120)
  }, [showCreate])

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = folderName.trim()
    if (!name) return
    startTransition(async () => {
      await createFolder(name)
      setFolderName('')
      setShowCreate(false)
      router.refresh()
    })
  }

  function handleDelete(folderId: string) {
    startTransition(async () => {
      await deleteFolder(folderId)
      router.refresh()
    })
  }

  return (
    <div className="relative min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>

      {/* Botons dalt a la dreta */}
      <div className="absolute top-0 right-0 pt-14 pr-5 flex items-center gap-2 z-10">
        <Link href="/notificaciones"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--brown-100)' }}
          aria-label="Notificaciones">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="w-4.5 h-4.5" style={{ color: 'var(--brown-500)' }}>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </Link>
        <Link href="/perfil/configuracion"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--brown-100)' }}
          aria-label="Configuración">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="w-4.5 h-4.5" style={{ color: 'var(--brown-500)' }}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </Link>
      </div>

      {/* Header: avatar + nom + username */}
      <div className="pt-24 pb-5 px-5 flex items-center gap-4">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.display_name}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
        ) : (
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-black text-black flex-shrink-0"
            style={{ background: 'var(--amber)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-black leading-tight" style={{ color: 'var(--brown-900)' }}>
            {user.display_name}
          </h1>
          <span className="text-sm mt-0.5 block" style={{ color: 'var(--brown-400)' }}>
            @{user.username ?? user.display_name}
          </span>
        </div>
      </div>

      {/* Siguiendo */}
      <div className="px-5 mb-5">
        <Link href="/perfil/siguiendo"
          className="flex items-center justify-between px-4 py-3.5 rounded-2xl transition-colors active:opacity-70"
          style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--brown-100)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                className="w-4.5 h-4.5" style={{ color: 'var(--brown-500)' }}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-semibold block" style={{ color: 'var(--brown-900)' }}>Siguiendo</span>
              <span className="text-xs" style={{ color: 'var(--brown-400)' }}>
                {followingCount} chef{followingCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4" style={{ color: 'var(--brown-300)' }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>

      {/* Mis carpetas */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black" style={{ color: 'var(--brown-900)' }}>Mis carpetas</h2>
          <div className="flex items-center gap-2">
            {initialFolders.length > 0 && (
              <button
                onClick={() => setEditMode(e => !e)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors active:opacity-70"
                style={{
                  background: editMode ? 'var(--brown-900)' : 'var(--brown-100)',
                  color: editMode ? '#fff' : 'var(--brown-600)',
                }}>
                {editMode ? 'Hecho' : 'Editar'}
              </button>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors active:opacity-70"
              style={{ background: 'var(--amber)', color: '#000' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nueva
            </button>
          </div>
        </div>

        {initialFolders.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 text-3xl"
              style={{ background: 'var(--brown-100)' }}>📁</div>
            <p className="font-semibold text-sm" style={{ color: 'var(--brown-700)' }}>Sin carpetas aún</p>
            <p className="text-xs mt-1 max-w-[220px]" style={{ color: 'var(--brown-400)' }}>
              Crea carpetas para organizar tus recetas guardadas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {initialFolders.map(folder => (
              <div key={folder.id} className="relative">
                <Link href={editMode ? '#' : `/perfil/carpeta/${folder.id}`}
                  onClick={e => { if (editMode) e.preventDefault() }}
                  className="block rounded-2xl overflow-hidden transition-opacity active:opacity-70"
                  style={{ border: '1.5px solid var(--brown-100)', opacity: editMode ? 0.85 : 1 }}>
                  {/* Cover */}
                  <div className="relative w-full" style={{ paddingTop: '75%' }}>
                    {folder.cover ? (
                      <img src={folder.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl"
                        style={{ background: 'var(--brown-100)' }}>📁</div>
                    )}
                  </div>
                  <div className="px-3 py-2.5" style={{ background: '#fff' }}>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--brown-900)' }}>{folder.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--brown-400)' }}>
                      {folder.count} receta{folder.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
                {editMode && (
                  <button
                    onClick={() => handleDelete(folder.id)}
                    disabled={isPending}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-opacity"
                    style={{ background: '#dc2626' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.45)', opacity: showCreate ? 1 : 0, pointerEvents: showCreate ? 'auto' : 'none' }}
        onClick={() => { setShowCreate(false); setFolderName('') }} />

      {/* Create folder sheet */}
      <div className="fixed inset-0 z-[70] pointer-events-none">
        <div className="h-full lg:pl-[72px] lg:flex lg:justify-center">
          <div className="w-full lg:max-w-[500px] h-full relative">
            <div className="absolute left-0 right-0 bottom-0 pointer-events-auto transition-transform duration-300 ease-out"
              style={{ background: 'var(--cream)', borderRadius: '20px 20px 0 0',
                transform: showCreate ? 'translateY(0)' : 'translateY(100%)' }}>
              <form onSubmit={handleCreate}>
                <div className="px-5 pt-4" style={{ paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 16px))' }}>
                  <div className="flex justify-center mb-4">
                    <div className="w-10 h-1 rounded-full" style={{ background: 'var(--brown-300)' }} />
                  </div>
                  <h3 className="font-black text-base mb-5" style={{ color: 'var(--brown-900)' }}>Nueva carpeta</h3>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                      style={{ color: 'var(--brown-400)' }}>Nombre</label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={folderName}
                      onChange={e => setFolderName(e.target.value)}
                      placeholder="Navidad, Desayunos, Verano…"
                      maxLength={40}
                      className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                      style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-900)', fontSize: 16 }}
                    />
                  </div>
                  <button type="submit" disabled={isPending || !folderName.trim()}
                    className="w-full py-3.5 rounded-2xl text-sm font-bold transition-opacity"
                    style={{ background: 'var(--amber)', color: '#000', opacity: isPending || !folderName.trim() ? 0.5 : 1 }}>
                    {isPending ? 'Creando…' : 'Crear carpeta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
