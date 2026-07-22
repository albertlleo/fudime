'use client'

import { useTransition, useState, useEffect } from 'react'
import Link from 'next/link'
import { registerAction, checkUsername } from '../actions'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')

  useEffect(() => {
    if (!username) { setUsernameStatus('idle'); return }
    if (!/^[a-z0-9_]{1,20}$/.test(username)) { setUsernameStatus('invalid'); return }
    if (username.length < 3) { setUsernameStatus('idle'); return }
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      const res = await checkUsername(username)
      setUsernameStatus(res.available ? 'available' : 'taken')
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  function handleUsernameInput(v: string) {
    setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await registerAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  const usernameColor =
    usernameStatus === 'available' ? '#16a34a'
    : usernameStatus === 'taken' ? '#dc2626'
    : usernameStatus === 'invalid' ? '#d97706'
    : 'var(--brown-300)'

  const usernameHint =
    usernameStatus === 'available' ? '✓ Disponible'
    : usernameStatus === 'taken' ? '✗ Ya está en uso'
    : usernameStatus === 'invalid' ? 'Solo letras minúsculas, números y _'
    : usernameStatus === 'checking' ? 'Comprobando...'
    : 'Solo letras minúsculas, números y _ (3–20 caracteres)'

  return (
    <div className="w-full" style={{ maxWidth: 390 }}>
      {/* Brand */}
      <div className="text-center mb-7">
        <img src="/logo_fudime.png" alt="FUDIME" className="w-14 h-14 rounded-3xl mb-3 inline-block" />
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--brown-700)' }}>
              Nombre completo <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input id="display_name" name="display_name" type="text" required autoComplete="name"
              placeholder="Tu nombre y apellidos" className="input-cream" />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--brown-700)' }}>
              Nombre de usuario <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none"
                style={{ color: 'var(--brown-400)' }}>@</span>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={e => handleUsernameInput(e.target.value)}
                autoComplete="username"
                placeholder="tunombre"
                className="input-cream pl-7"
                maxLength={20}
              />
            </div>
            <p className="text-xs mt-1.5" style={{ color: usernameColor }}>{usernameHint}</p>
          </div>

          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--brown-700)' }}>
              Fecha de nacimiento <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input id="birthdate" name="birthdate" type="date" required
              max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="input-cream"
              style={{ colorScheme: 'light' }}
            />
            <p className="text-xs mt-1.5" style={{ color: 'var(--brown-300)' }}>Debes ser mayor de 18 años</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--brown-700)' }}>
              Correo electrónico <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input id="email" name="email" type="email" required autoComplete="email"
              placeholder="tu@email.com" className="input-cream" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--brown-700)' }}>
              Contraseña <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input id="password" name="password" type="password" required autoComplete="new-password"
              minLength={6} placeholder="Mínimo 6 caracteres" className="input-cream" />
          </div>

          {/* Creator disclaimer */}
          <div className="rounded-2xl p-3.5" style={{ background: 'var(--brown-50, #fdfaf7)', border: '1.5px solid var(--brown-100)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--brown-500)' }}>
              Podrás activar tu cuenta como creador una vez hayas creado la cuenta.{' '}
              <a href="https://fudime.com" target="_blank" rel="noopener noreferrer"
                className="font-semibold underline" style={{ color: 'var(--brown-700)' }}>
                Más info aquí
              </a>
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending || usernameStatus === 'taken' || usernameStatus === 'checking'}
            className="w-full font-semibold rounded-2xl py-3.5 text-sm mt-1 transition-opacity"
            style={{
              background: 'var(--amber)',
              color: '#000',
              opacity: isPending || usernameStatus === 'taken' || usernameStatus === 'checking' ? 0.5 : 1,
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
