'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { registerAction } from '../actions'
import type { UserRole } from '@/lib/types'

function RoleCard({
  value,
  selected,
  onSelect,
  title,
  description,
  icon,
}: {
  value: UserRole
  selected: boolean
  onSelect: (v: UserRole) => void
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
        selected
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-stone-300 bg-stone-100 hover:border-stone-300'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className={`font-semibold text-sm ${selected ? 'text-amber-500' : 'text-stone-700'}`}>
        {title}
      </span>
      <span className="text-stone-500 text-xs leading-relaxed">{description}</span>
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
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">FUDIME</h1>
        <p className="text-stone-500 mt-1 text-sm">Recetas en vídeo que usarás de verdad</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-6">Crea tu cuenta</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-5">
          <p className="text-sm font-medium text-stone-600 mb-3">¿Cómo usarás FUDIME?</p>
          <div className="flex gap-3">
            <RoleCard
              value="consumer"
              selected={role === 'consumer'}
              onSelect={setRole}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={role === 'consumer' ? 'text-amber-400' : 'text-stone-500'}>
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              }
              title="Descubrir recetas"
              description="Encuentra e inspírate con recetas de creadores"
            />
            <RoleCard
              value="creator"
              selected={role === 'creator'}
              onSelect={setRole}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={role === 'creator' ? 'text-amber-400' : 'text-stone-500'}>
                  <path d="m22 8-6 4 6 4V8Z"/>
                  <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
                </svg>
              }
              title="Crear contenido"
              description="Publica tus recetas en vídeo para la comunidad"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="role" value={role} />

          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-stone-600 mb-1.5">
              Nombre
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              autoComplete="name"
              placeholder="Tu nombre o apodo"
              className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-600 mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-600 mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
            />
          </div>

          {role === 'creator' && (
            <div>
              <label htmlFor="social_url" className="block text-sm font-medium text-stone-600 mb-1.5">
                Instagram o TikTok
                <span className="text-stone-500 font-normal ml-1">(para validación)</span>
              </label>
              <input
                id="social_url"
                name="social_url"
                type="url"
                placeholder="https://instagram.com/tuusuario"
                className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
              />
              <p className="text-stone-600 text-xs mt-1.5">
                Necesitamos validar tu cuenta antes de que puedas publicar.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-black font-semibold rounded-xl py-2.5 transition-colors text-sm mt-2"
          >
            {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
      </div>

      <p className="text-center text-stone-500 text-sm mt-4">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-stone-500 hover:text-amber-400 font-medium transition-colors">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
