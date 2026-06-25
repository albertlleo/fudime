'use client'

import { useTransition, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { loginAction } from '../actions'

function ConfirmBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get('confirm') !== '1') return null
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
      <p className="text-amber-400 text-sm">
        Revisa tu email y confirma tu cuenta antes de iniciar sesión.
      </p>
    </div>
  )
}

function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <>
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-black font-semibold rounded-xl py-2.5 transition-colors text-sm mt-2"
        >
          {isPending ? 'Entrando...' : 'Iniciar sesión'}
        </button>
      </form>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">FUDIME</h1>
        <p className="text-stone-500 mt-1 text-sm">Recetas en vídeo que usarás de verdad</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-6">Bienvenido de vuelta</h2>
        <Suspense>
          <ConfirmBanner />
        </Suspense>
        <LoginForm />
      </div>

      <p className="text-center text-stone-500 text-sm mt-4">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-stone-500 hover:text-amber-400 font-medium transition-colors">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
