'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { User } from '@/lib/types'

type Chef = Pick<User, 'id' | 'display_name' | 'avatar_url' | 'validated_at' | 'bio'>

function ChefCard({ chef }: { chef: Chef }) {
  const initials = chef.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <Link href={`/creador/${chef.id}`} className="flex flex-col items-center gap-2 active:opacity-70 transition-opacity">
      <div className="relative">
        {chef.avatar_url ? (
          <img src={chef.avatar_url} alt={chef.display_name}
            className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-black text-black"
            style={{ background: 'var(--amber)' }}>
            {initials}
          </div>
        )}
        {chef.validated_at && (
          <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#fff', border: '1px solid var(--brown-100)' }}>
            <svg viewBox="0 0 16 16" className="w-4 h-4">
              <circle cx="8" cy="8" r="8" fill="#F59E0B" />
              <path d="M4.5 8.3l2.3 2.3 4.3-4.6" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-center leading-tight line-clamp-2 max-w-[80px]"
        style={{ color: 'var(--brown-900)' }}>
        {chef.display_name}
      </p>
    </Link>
  )
}

interface Props {
  following: Chef[]
  discover: Chef[]
}

export default function ChefsClient({ following, discover }: Props) {
  const [query, setQuery] = useState('')

  const q = query.toLowerCase().trim()
  const filteredFollowing = following.filter(c => !q || c.display_name.toLowerCase().includes(q))
  const filteredDiscover = discover.filter(c => !q || c.display_name.toLowerCase().includes(q))

  return (
    <div className="h-dvh overflow-y-auto pb-20" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-black mb-4" style={{ color: 'var(--brown-900)' }}>Chefs</h1>

        {/* Search */}
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--brown-300)' }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar chef..."
            className="input-cream pl-10"
          />
        </div>
      </div>

      {/* Following */}
      {filteredFollowing.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4 px-5"
            style={{ color: 'var(--brown-300)' }}>
            Siguiendo · {filteredFollowing.length}
          </p>
          <div className="grid grid-cols-3 gap-x-2 gap-y-5 px-5">
            {filteredFollowing.map(chef => <ChefCard key={chef.id} chef={chef} />)}
          </div>
        </div>
      )}

      {/* Discover */}
      {filteredDiscover.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4 px-5"
            style={{ color: 'var(--brown-300)' }}>
            {q ? 'Resultados' : 'Descubrir'} · {filteredDiscover.length}
          </p>
          <div className="grid grid-cols-3 gap-x-2 gap-y-5 px-5">
            {filteredDiscover.map(chef => <ChefCard key={chef.id} chef={chef} />)}
          </div>
        </div>
      )}

      {/* Empty */}
      {filteredFollowing.length === 0 && filteredDiscover.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
            style={{ background: 'var(--brown-100)' }}>👨‍🍳</div>
          <h2 className="font-bold text-base mb-1" style={{ color: 'var(--brown-900)' }}>
            {q ? 'Sin resultados' : 'Aún no hay chefs'}
          </h2>
          <p className="text-sm" style={{ color: 'var(--brown-500)' }}>
            {q ? `No hay chefs con "${query}"` : 'Los creadores aparecerán aquí cuando se registren'}
          </p>
        </div>
      )}
    </div>
  )
}
