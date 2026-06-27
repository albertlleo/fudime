'use client'

import { useState } from 'react'
import { promoteToCreator, validateCreator, revokeCreator } from './actions'

export default function AllUsers({ users: initial }: { users: any[] }) {
  const [users, setUsers] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = users.filter(u =>
    u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  async function handlePromote(id: string) {
    setLoading(id)
    const result = await promoteToCreator(id)
    if (!result.error) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: 'creator', validated_at: null } : u))
    }
    setLoading(null)
  }

  async function handleValidate(id: string) {
    setLoading(id)
    const result = await validateCreator(id)
    if (!result.error) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, validated_at: new Date().toISOString() } : u))
    }
    setLoading(null)
  }

  async function handleRevoke(id: string) {
    setLoading(id)
    const result = await revokeCreator(id)
    if (!result.error) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: 'consumer', validated_at: null } : u))
    }
    setLoading(null)
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 text-sm mb-3 focus:outline-none focus:border-amber-500"
      />
      <div className="bg-white rounded-2xl divide-y divide-stone-100 shadow-sm">
        {filtered.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-8">Sin resultados</p>
        )}
        {filtered.map(u => (
          <div key={u.id} className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold text-xs flex-shrink-0">
              {u.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-stone-900 text-sm font-medium truncate">{u.display_name}</p>
              <p className="text-stone-400 text-xs truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {u.role === 'consumer' ? (
                <button
                  onClick={() => handlePromote(u.id)}
                  disabled={loading === u.id}
                  className="text-xs px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {loading === u.id ? '...' : 'Hacer creador'}
                </button>
              ) : u.validated_at ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600 text-xs font-medium">✓ Validado</span>
                  <button
                    onClick={() => handleRevoke(u.id)}
                    disabled={loading === u.id}
                    className="text-xs px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {loading === u.id ? '...' : 'Revocar'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500 text-xs font-medium">Pendiente</span>
                  <button
                    onClick={() => handleValidate(u.id)}
                    disabled={loading === u.id}
                    className="text-xs px-2.5 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
                  >
                    {loading === u.id ? '...' : 'Validar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
