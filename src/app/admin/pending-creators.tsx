'use client'

import { useState } from 'react'
import { validateCreator, rejectCreator } from './actions'
import type { User } from '@/lib/types'

interface CreatorRequestRow {
  id: string
  user_id: string
  instagram_url: string | null
  tiktok_url: string | null
  other_links: string | null
  status: string
  created_at: string
  users: User
}

export default function PendingCreators({ requests: initial }: { requests: CreatorRequestRow[] }) {
  const [requests, setRequests] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <span className="text-3xl">✅</span>
        <p className="text-stone-500 text-sm mt-2">No hay solicitudes pendientes</p>
      </div>
    )
  }

  async function handleValidate(userId: string) {
    setLoading(userId)
    const result = await validateCreator(userId)
    if (!result.error) setRequests(prev => prev.filter(r => r.user_id !== userId))
    setLoading(null)
  }

  async function handleReject(userId: string) {
    setLoading(userId)
    const result = await rejectCreator(userId)
    if (!result.error) setRequests(prev => prev.filter(r => r.user_id !== userId))
    setLoading(null)
  }

  return (
    <div className="space-y-3">
      {requests.map(req => {
        const creator = req.users
        return (
          <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                {creator.display_name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-stone-900 font-semibold text-sm">{creator.display_name}</p>
                {creator.username && (
                  <p className="text-stone-400 text-xs">@{creator.username}</p>
                )}
                <p className="text-stone-500 text-xs">{creator.email}</p>
                <div className="flex gap-3 mt-2 flex-wrap">
                  {req.instagram_url && (
                    <a href={req.instagram_url} target="_blank" rel="noopener noreferrer"
                      className="text-pink-600 text-xs hover:underline truncate max-w-[160px]">
                      📸 Instagram ↗
                    </a>
                  )}
                  {req.tiktok_url && (
                    <a href={req.tiktok_url} target="_blank" rel="noopener noreferrer"
                      className="text-stone-900 text-xs hover:underline truncate max-w-[160px]">
                      🎵 TikTok ↗
                    </a>
                  )}
                  {req.other_links && (
                    <p className="text-stone-600 text-xs w-full">🔗 {req.other_links}</p>
                  )}
                </div>
                <p className="text-stone-400 text-[10px] mt-1">
                  Solicitado {new Date(req.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleValidate(req.user_id)}
                disabled={loading === req.user_id}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold text-sm py-2 rounded-xl transition-colors"
              >
                {loading === req.user_id ? '...' : '✓ Aprobar'}
              </button>
              <button
                onClick={() => handleReject(req.user_id)}
                disabled={loading === req.user_id}
                className="flex-1 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 font-medium text-sm py-2 rounded-xl transition-colors"
              >
                Rechazar
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
