'use client'

import { useState } from 'react'
import { validateCreator, rejectCreator } from './actions'
import type { User } from '@/lib/types'

export default function PendingCreators({ creators: initial }: { creators: User[] }) {
  const [creators, setCreators] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  if (creators.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <span className="text-3xl">✅</span>
        <p className="text-stone-500 text-sm mt-2">No hay creadores pendientes</p>
      </div>
    )
  }

  async function handleValidate(id: string) {
    setLoading(id)
    const result = await validateCreator(id)
    if (!result.error) setCreators(prev => prev.filter(c => c.id !== id))
    setLoading(null)
  }

  async function handleReject(id: string) {
    setLoading(id)
    const result = await rejectCreator(id)
    if (!result.error) setCreators(prev => prev.filter(c => c.id !== id))
    setLoading(null)
  }

  return (
    <div className="space-y-3">
      {creators.map(creator => (
        <div key={creator.id} className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
              {creator.display_name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-stone-900 font-semibold text-sm">{creator.display_name}</p>
              <p className="text-stone-500 text-xs">{creator.email}</p>
              {creator.bio && <p className="text-stone-600 text-xs mt-1 italic">"{creator.bio}"</p>}
              <div className="flex gap-3 mt-2 flex-wrap">
                {creator.instagram_url && (
                  <a href={creator.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 text-xs hover:underline truncate max-w-[160px]">
                    Instagram ↗
                  </a>
                )}
                {creator.tiktok_url && (
                  <a href={creator.tiktok_url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 text-xs hover:underline truncate max-w-[160px]">
                    TikTok ↗
                  </a>
                )}
              </div>
              <p className="text-stone-400 text-[10px] mt-1">
                Registrado {new Date(creator.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleValidate(creator.id)}
              disabled={loading === creator.id}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold text-sm py-2 rounded-xl transition-colors"
            >
              {loading === creator.id ? '...' : '✓ Validar'}
            </button>
            <button
              onClick={() => handleReject(creator.id)}
              disabled={loading === creator.id}
              className="flex-1 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 font-medium text-sm py-2 rounded-xl transition-colors"
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
