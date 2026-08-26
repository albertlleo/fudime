'use client'

import Link from 'next/link'
import FolderGrid from './folder-grid'
import VerifiedBadge from '@/components/verified-badge'
import type { User } from '@/lib/types'

export interface FolderInfo {
  id: string
  name: string
  count: number
  cover: string | null      // cover from saved recipe thumbnail (fallback)
  cover_url: string | null  // custom cover uploaded by user
}

export default function ConsumerProfile({
  user,
  followingCount,
  folders,
}: {
  user: User
  followingCount: number
  folders: FolderInfo[]
}) {
  const initials = user.display_name
    .split(' ').map(w => w[0] ?? '').filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'

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
        <FolderGrid folders={folders} />
      </div>
    </div>
  )
}
