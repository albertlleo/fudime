'use client'

import { useState, useTransition } from 'react'
import BackButton from '@/components/back-button'
import { deleteAccount } from '../configuracion/actions'

export default function EliminarCuentaPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await deleteAccount(formData)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-6 flex items-center gap-3">
        <BackButton fallback="/perfil/configuracion" />
        <h1 className="text-xl font-black" style={{ color: '#dc2626' }}>Eliminar cuenta</h1>
      </div>

      <div className="px-5 space-y-4">
        {/* Warning */}
        <div className="rounded-3xl p-5" style={{ background: '#fff5f5', border: '1.5px solid #fca5a5' }}>
          <div className="flex items-start gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5 flex-shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#991b1b' }}>Esta acción es irreversible</p>
              <p className="text-sm leading-relaxed" style={{ color: '#991b1b' }}>
                Se eliminarán permanentemente tu cuenta, tus recetas, comentarios, seguidores y todos tus datos. No hay vuelta atrás.
              </p>
            </div>
          </div>
        </div>

        {!confirmed ? (
          <div className="pt-2">
            <button
              onClick={() => setConfirmed(true)}
              className="w-full font-semibold rounded-2xl py-3.5 text-sm"
              style={{ background: '#fff', border: '1.5px solid #fca5a5', color: '#dc2626' }}>
              Entiendo, quiero eliminar mi cuenta
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-2xl p-3.5" style={{ background: '#fff5f5', border: '1.5px solid #fca5a5' }}>
                <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
                Escribe tu correo electrónico para confirmar
              </label>
              <input name="email" type="email" required
                placeholder="tu@correo.com" className="input-cream" />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isPending}
                className="w-full font-semibold rounded-2xl py-3.5 text-sm transition-opacity"
                style={{ background: '#dc2626', color: '#fff', opacity: isPending ? 0.6 : 1 }}>
                {isPending ? 'Eliminando...' : 'Eliminar cuenta definitivamente'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
