'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createFolder, deleteFolder, updateFolder, getFolderCoverSignature } from './actions'
import type { FolderInfo } from './consumer-profile'

type SheetState =
  | { type: 'options'; folder: FolderInfo }
  | { type: 'rename'; folder: FolderInfo }
  | { type: 'confirm-delete'; folder: FolderInfo }
  | null

export default function FolderGrid({ folders: initialFolders }: { folders: FolderInfo[] }) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [sheet, setSheet] = useState<SheetState>(null)
  const [renameValue, setRenameValue] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [coverUploading, setCoverUploading] = useState(false)
  const createInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showCreate) setTimeout(() => createInputRef.current?.focus(), 120)
  }, [showCreate])

  useEffect(() => {
    if (sheet?.type === 'rename') setTimeout(() => renameInputRef.current?.focus(), 120)
  }, [sheet])

  function closeAll() {
    setSheet(null)
    setShowCreate(false)
    setCreateName('')
    setRenameValue('')
  }

  function handleFolderClick(folder: FolderInfo, e: React.MouseEvent) {
    if (editMode) {
      e.preventDefault()
      setSheet({ type: 'options', folder })
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = createName.trim()
    if (!name) return
    startTransition(async () => {
      await createFolder(name)
      setCreateName('')
      setShowCreate(false)
      router.refresh()
    })
  }

  function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (sheet?.type !== 'rename') return
    const name = renameValue.trim()
    if (!name) return
    const folderId = sheet.folder.id
    startTransition(async () => {
      await updateFolder(folderId, { name })
      setSheet(null)
      router.refresh()
    })
  }

  function handleDelete() {
    if (sheet?.type !== 'confirm-delete') return
    const folderId = sheet.folder.id
    startTransition(async () => {
      await deleteFolder(folderId)
      setSheet(null)
      router.refresh()
    })
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || sheet?.type !== 'options') return
    const folderId = sheet.folder.id
    setCoverUploading(true)
    try {
      const sig = await getFolderCoverSignature()
      const fd = new FormData()
      fd.append('file', file)
      fd.append('signature', sig.signature)
      fd.append('timestamp', String(sig.timestamp))
      fd.append('folder', sig.folder)
      fd.append('api_key', sig.apiKey)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.secure_url) {
        await updateFolder(folderId, { cover_url: data.secure_url })
        setSheet(null)
        router.refresh()
      }
    } finally {
      setCoverUploading(false)
      if (coverFileRef.current) coverFileRef.current.value = ''
    }
  }

  const backdropVisible = showCreate || sheet !== null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-black" style={{ color: 'var(--brown-900)' }}>Mis carpetas</h2>
        <div className="flex items-center gap-2">
          {initialFolders.length > 0 && (
            <button onClick={() => { setEditMode(e => !e); setSheet(null) }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors active:opacity-70"
              style={{
                background: editMode ? 'var(--brown-900)' : 'var(--brown-100)',
                color: editMode ? '#fff' : 'var(--brown-600)',
              }}>
              {editMode ? 'Hecho' : 'Editar'}
            </button>
          )}
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors active:opacity-70"
            style={{ background: 'var(--amber)', color: '#000' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nueva
          </button>
        </div>
      </div>

      {/* Grid */}
      {initialFolders.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 text-3xl" style={{ background: 'var(--brown-100)' }}>📁</div>
          <p className="font-semibold text-sm" style={{ color: 'var(--brown-700)' }}>Sin carpetas aún</p>
          <p className="text-xs mt-1 max-w-[220px]" style={{ color: 'var(--brown-400)' }}>
            Crea carpetas para organizar tus recetas guardadas
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {initialFolders.map(folder => {
            const displayCover = folder.cover_url ?? folder.cover
            return (
              <div key={folder.id} className="relative">
                <Link href={`/perfil/carpeta/${folder.id}`}
                  onClick={e => handleFolderClick(folder, e)}
                  className="block rounded-2xl overflow-hidden transition-opacity active:opacity-70"
                  style={{ border: '1.5px solid var(--brown-100)', opacity: editMode ? 0.85 : 1 }}>
                  <div className="relative w-full" style={{ paddingTop: '75%' }}>
                    {displayCover
                      ? <img src={displayCover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      : <div className="absolute inset-0 flex items-center justify-center text-3xl" style={{ background: 'var(--brown-100)' }}>📁</div>
                    }
                  </div>
                  <div className="px-3 py-2.5" style={{ background: '#fff' }}>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--brown-900)' }}>{folder.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--brown-400)' }}>
                      {folder.count} receta{folder.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
                {editMode && (
                  <button onClick={() => setSheet({ type: 'options', folder })}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.55)' }}>
                    <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                      <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Hidden cover file input */}
      <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.45)', opacity: backdropVisible ? 1 : 0, pointerEvents: backdropVisible ? 'auto' : 'none' }}
        onClick={closeAll} />

      {/* Options sheet */}
      <BottomSheet open={sheet?.type === 'options'}>
        {sheet?.type === 'options' && (
          <>
            <div className="px-5 pt-2 pb-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-center mb-1" style={{ color: 'var(--brown-400)' }}>
                {sheet.folder.name}
              </p>
            </div>
            <SheetRow icon={<PencilIcon />} label="Cambiar nombre"
              onClick={() => { setRenameValue(sheet.folder.name); setSheet({ type: 'rename', folder: sheet.folder }) }} />
            <SheetRow
              icon={coverUploading
                ? <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--brown-200)', borderTopColor: 'var(--brown-700)' }} />
                : <PhotoIcon />}
              label={coverUploading ? 'Subiendo…' : 'Cambiar foto de portada'}
              onClick={() => !coverUploading && coverFileRef.current?.click()} />
            <SheetRow icon={<TrashIcon />} label="Eliminar carpeta" danger
              onClick={() => setSheet({ type: 'confirm-delete', folder: sheet.folder })} />
            <button onClick={closeAll}
              className="w-full flex items-center justify-center py-4 text-sm font-medium"
              style={{ borderTop: '1px solid var(--brown-100)', color: 'var(--brown-400)', marginBottom: 'env(safe-area-inset-bottom)' }}>
              Cancelar
            </button>
          </>
        )}
      </BottomSheet>

      {/* Rename sheet */}
      <BottomSheet open={sheet?.type === 'rename'}>
        {sheet?.type === 'rename' && (
          <form onSubmit={handleRename}>
            <div className="px-5 pt-4" style={{ paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 16px))' }}>
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--brown-300)' }} />
              </div>
              <h3 className="font-black text-base mb-5" style={{ color: 'var(--brown-900)' }}>Cambiar nombre</h3>
              <div className="mb-4">
                <input ref={renameInputRef} type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)}
                  maxLength={40}
                  className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                  style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-900)', fontSize: 16 }} />
              </div>
              <button type="submit" disabled={isPending || !renameValue.trim()}
                className="w-full py-3.5 rounded-2xl text-sm font-bold transition-opacity"
                style={{ background: 'var(--amber)', color: '#000', opacity: isPending || !renameValue.trim() ? 0.5 : 1 }}>
                {isPending ? 'Guardando…' : 'Guardar nombre'}
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Create folder sheet */}
      <BottomSheet open={showCreate}>
        <form onSubmit={handleCreate}>
          <div className="px-5 pt-4" style={{ paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 16px))' }}>
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--brown-300)' }} />
            </div>
            <h3 className="font-black text-base mb-5" style={{ color: 'var(--brown-900)' }}>Nueva carpeta</h3>
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--brown-400)' }}>Nombre</label>
              <input ref={createInputRef} type="text" value={createName} onChange={e => setCreateName(e.target.value)}
                placeholder="Navidad, Desayunos, Verano…" maxLength={40}
                className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-900)', fontSize: 16 }} />
            </div>
            <button type="submit" disabled={isPending || !createName.trim()}
              className="w-full py-3.5 rounded-2xl text-sm font-bold transition-opacity"
              style={{ background: 'var(--amber)', color: '#000', opacity: isPending || !createName.trim() ? 0.5 : 1 }}>
              {isPending ? 'Creando…' : 'Crear carpeta'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Confirm delete dialog */}
      {sheet?.type === 'confirm-delete' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-6 pointer-events-none">
          <div className="w-full max-w-sm rounded-3xl p-6 pointer-events-auto" style={{ background: '#fff' }}>
            <h3 className="text-lg font-black mb-1" style={{ color: 'var(--brown-900)' }}>
              ¿Eliminar carpeta?
            </h3>
            <p className="text-sm mb-1" style={{ color: 'var(--brown-500)' }}>
              «{sheet.folder.name}»
            </p>
            <p className="text-sm mb-5" style={{ color: 'var(--brown-400)' }}>
              Las recetas guardadas no se eliminarán, solo la carpeta.
            </p>
            <div className="flex gap-3">
              <button onClick={closeAll}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: 'var(--brown-100)', color: 'var(--brown-700)' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={isPending}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-opacity"
                style={{ background: '#dc2626', color: '#fff', opacity: isPending ? 0.6 : 1 }}>
                {isPending ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function BottomSheet({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      <div className="h-full lg:pl-[72px] lg:flex lg:justify-center">
        <div className="w-full lg:max-w-[500px] h-full relative">
          <div className="absolute left-0 right-0 bottom-0 pointer-events-auto transition-transform duration-300 ease-out"
            style={{ background: 'var(--cream)', borderRadius: '20px 20px 0 0', transform: open ? 'translateY(0)' : 'translateY(100%)' }}
            onClick={e => e.stopPropagation()}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function SheetRow({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3.5 px-5 py-4 active:opacity-70 transition-opacity"
      style={{ borderTop: '1px solid var(--brown-100)' }}>
      <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center"
        style={{ color: danger ? '#dc2626' : 'var(--brown-700)' }}>
        {icon}
      </span>
      <span className="text-base font-medium" style={{ color: danger ? '#dc2626' : 'var(--brown-900)' }}>
        {label}
      </span>
    </button>
  )
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}
