'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/back-button'
import { changePassword } from '../configuracion/actions'

export default function CambiarContrasenaPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
        setTimeout(() => router.push('/perfil/configuracion'), 1500)
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
            <button type="submit" disabled={isPending}
              className="w-full font-semibold rounded-2xl py-3.5 text-sm transition-opacity"
              style={{ background: 'var(--amber)', color: '#000', opacity: isPending ? 0.6 : 1 }}>
              {isPending ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
