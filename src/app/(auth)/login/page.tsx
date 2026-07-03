'use client'

import { useTransition, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { loginAction } from '../actions'

function ConfirmBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get('confirm') !== '1') return null
  return (
    <div className="rounded-2xl p-3.5 mb-5" style={{ background: '#fffbeb', border: '1.5px solid #fcd34d' }}>
      <p className="text-sm" style={{ color: '#92400e' }}>
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
        <div className="rounded-2xl p-3.5 mb-5" style={{ background: '#fff5f5', border: '1.5px solid #fca5a5' }}>
          <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <input id="password" name="password" type="password" required autoComplete="current-password"
            placeholder="••••••••" className="input-cream" />
        </div>
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
          {isPending ? 'Entrando...' : 'Iniciar sesión'}
        </button>
      </form>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="w-full" style={{ maxWidth: 390 }}>
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4 text-2xl font-black text-black"
          style={{ background: 'var(--amber)' }}>
          F
        </div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--brown-900)' }}>FUDIME</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--brown-500)' }}>Recetas en vídeo que usarás de verdad</p>
      </div>

      {/* Card */}
      <div className="rounded-3xl p-6 shadow-sm" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
        <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--brown-900)' }}>Bienvenido de vuelta</h2>
        <Suspense>
          <ConfirmBanner />
        </Suspense>
        <LoginForm />
      </div>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--brown-500)' }}>
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="font-semibold" style={{ color: 'var(--brown-900)' }}>
          Regístrate
        </Link>
      </p>
    </div>
  )
}
