'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { registerAction } from '../actions'
import type { UserRole } from '@/lib/types'

function RoleCard({
  value, selected, onSelect, title, description, emoji,
}: {
  value: UserRole; selected: boolean; onSelect: (v: UserRole) => void
  title: string; description: string; emoji: string
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl text-center transition-all"
      style={{
        border: selected ? '2px solid var(--amber)' : '2px solid var(--brown-100)',
        background: selected ? '#fffbeb' : '#fff',
      }}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="font-semibold text-sm" style={{ color: selected ? '#92400e' : 'var(--brown-700)' }}>
        {title}
      </span>
      <span className="text-xs leading-relaxed" style={{ color: 'var(--brown-500)' }}>{description}</span>
    </button>
  )
}

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>('consumer')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('role', role)
    startTransition(async () => {
      const result = await registerAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="w-full" style={{ maxWidth: 390 }}>
      {/* Brand */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl mb-3 text-xl font-black text-black"
          style={{ background: 'var(--amber)' }}>
          F
        </div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--brown-900)' }}>FUDIME</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--brown-500)' }}>Recetas en vídeo que usarás de verdad</p>
      </div>

      {/* Card */}
      <div className="rounded-3xl p-6 shadow-sm" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
        <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--brown-900)' }}>Crea tu cuenta</h2>

        {error && (
          <div className="rounded-2xl p-3.5 mb-4" style={{ background: '#fff5f5', border: '1.5px solid #fca5a5' }}>
            <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
          </div>
        )}

        <div className="mb-5">
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--brown-700)' }}>¿Cómo usarás FUDIME?</p>
          <div className="flex gap-3">
            <RoleCard
              value="consumer" selected={role === 'consumer'} onSelect={setRole}
              emoji="🍽️" title="Descubrir" description="Explora recetas de creadores"
            />
            <RoleCard
              value="creator" selected={role === 'creator'} onSelect={setRole}
              emoji="🎬" title="Crear" description="Publica tus recetas en vídeo"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="role" value={role} />

          <div>
            <label htmlFor="display_name" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--brown-700)' }}>
              Nombre
            </label>
            <input id="display_name" name="display_name" type="text" required autoComplete="name"
              placeholder="Tu nombre o apodo" className="input-cream" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--brown-700)' }}>
              Email
            </label>
            <input id="email" name="email" type="email" required autoComplete="email"
              placeholder="tu@email.com" className="input-cream" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--brown-700)' }}>
              Contraseña
            </label>
            <input id="password" name="password" type="password" required autoComplete="new-password"
              minLength={6} placeholder="Mínimo 6 caracteres" className="input-cream" />
          </div>

          {role === 'creator' && (
            <div>
              <label htmlFor="social_url" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--brown-700)' }}>
                Instagram o TikTok{' '}
                <span className="font-normal" style={{ color: 'var(--brown-500)' }}>(para validación)</span>
              </label>
              <input id="social_url" name="social_url" type="url"
                placeholder="https://instagram.com/tuusuario" className="input-cream" />
              <p className="text-xs mt-1.5" style={{ color: 'var(--brown-500)' }}>
                Validamos tu cuenta antes de que puedas publicar.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full font-semibold rounded-2xl py-3.5 text-sm mt-1 transition-opacity"
            style={{
              background: isPending ? 'rgba(245,158,11,0.5)' : 'var(--amber)',
              color: '#000',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--brown-500)' }}>
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-semibold" style={{ color: 'var(--brown-900)' }}>
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
