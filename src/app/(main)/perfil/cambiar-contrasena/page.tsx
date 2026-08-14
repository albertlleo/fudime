'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/back-button'
import { changePassword, sendPasswordReset } from '../configuracion/actions'

export default function CambiarContrasenaPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSendingReset, startResetTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await changePassword(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/perfil/configuracion'), 1800)
      }
    })
  }

  function handleForgotPassword() {
    setResetError(null)
    startResetTransition(async () => {
      const result = await sendPasswordReset()
      if (result.error) {
        setResetError(result.error)
      } else {
        setResetSent(true)
      }
    })
  }

  return (
    <div className="min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-6 flex items-center gap-3">
        <BackButton fallback="/perfil/configuracion" />
        <h1 className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>Cambiar contraseña</h1>
      </div>

      <div className="px-5 space-y-4">
        {error && (
          <div className="rounded-2xl p-3.5" style={{ background: '#fff5f5', border: '1.5px solid #fca5a5' }}>
            <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-2xl p-3.5" style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}>
            <p className="text-sm" style={{ color: '#166534' }}>Contraseña actualizada correctamente.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
              Contraseña actual
            </label>
            <input name="current_password" type="password" required
              placeholder="Tu contraseña actual" className="input-cream" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
              Nueva contraseña
            </label>
            <input name="password" type="password" required minLength={6}
              placeholder="Mínimo 6 caracteres" className="input-cream" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
              Confirmar contraseña
            </label>
            <input name="confirm" type="password" required minLength={6}
              placeholder="Repite la nueva contraseña" className="input-cream" />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={isPending || success}
              className="w-full font-semibold rounded-2xl py-3.5 text-sm transition-opacity"
              style={{ background: 'var(--amber)', color: '#000', opacity: isPending || success ? 0.6 : 1 }}>
              {isPending ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>

        {/* Separador */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px" style={{ background: 'var(--brown-100)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--brown-300)' }}>o</span>
          <div className="flex-1 h-px" style={{ background: 'var(--brown-100)' }} />
        </div>

        {/* Olvidé mi contraseña */}
        {resetSent ? (
          <div className="rounded-2xl p-3.5" style={{ background: '#fffbf0', border: '1.5px solid #fcd34d' }}>
            <p className="text-sm text-center" style={{ color: 'var(--brown-700)' }}>
              Te hemos enviado un enlace de recuperación a tu correo registrado. Revisa también el spam.
            </p>
          </div>
        ) : (
          <>
            {resetError && (
              <p className="text-xs text-center" style={{ color: '#dc2626' }}>{resetError}</p>
            )}
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isSendingReset}
              className="w-full text-sm font-semibold py-3 rounded-2xl transition-opacity"
              style={{
                background: '#fff',
                border: '1.5px solid var(--brown-100)',
                color: 'var(--brown-700)',
                opacity: isSendingReset ? 0.6 : 1,
              }}
            >
              {isSendingReset ? 'Enviando...' : 'He olvidado mi contraseña'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
