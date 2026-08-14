'use client'

import { useState, useTransition } from 'react'
import BackButton from '@/components/back-button'
import { changeEmail } from '../configuracion/actions'

export default function CambiarCorreoPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sentTo, setSentTo] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string).trim()
    startTransition(async () => {
      const result = await changeEmail(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSentTo(email)
        setSuccess(true)
      }
    })
  }

  return (
    <div className="min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-6 flex items-center gap-3">
        <BackButton fallback="/perfil/configuracion" />
        <h1 className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>Cambiar correo</h1>
      </div>

      <div className="px-5 space-y-4">
        {error && (
          <div className="rounded-2xl p-3.5" style={{ background: '#fff5f5', border: '1.5px solid #fca5a5' }}>
            <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
          </div>
        )}

        {success ? (
          <div className="rounded-3xl p-5" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: '#f0fdf4' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="font-bold text-base mb-1" style={{ color: 'var(--brown-900)' }}>Correo de confirmación enviado</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--brown-500)' }}>
              Hemos enviado un enlace de confirmación a <span className="font-semibold">{sentTo}</span>. Ábrelo para completar el cambio.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-3xl p-4" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--brown-500)' }}>
                Te enviaremos un correo de confirmación a la nueva dirección. El cambio no será efectivo hasta que lo confirmes.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
                Nuevo correo electrónico
              </label>
              <input name="email" type="email" required
                placeholder="nuevo@correo.com" className="input-cream" />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isPending}
                className="w-full font-semibold rounded-2xl py-3.5 text-sm transition-opacity"
                style={{ background: 'var(--amber)', color: '#000', opacity: isPending ? 0.6 : 1 }}>
                {isPending ? 'Enviando...' : 'Enviar confirmación'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
