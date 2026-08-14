'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitCreatorRequest } from './actions'

export default function CreatorRequestForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await submitCreatorRequest(formData)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/perfil')
      }
    })
  }

  return (
    <div>
      {/* Intro */}
      <div className="rounded-3xl p-5 mb-5" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
        <h2 className="font-bold text-base mb-2" style={{ color: 'var(--brown-900)' }}>
          ¿Quieres subir recetas en vídeo?
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--brown-500)' }}>
          Comparte tus perfiles para que podamos validar tu cuenta como creador.
          Revisamos manualmente cada solicitud.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-2xl p-3.5" style={{ background: '#fff5f5', border: '1.5px solid #fca5a5' }}>
            <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
            Instagram
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
              obligatorio
            </span>
          </label>
          <input name="instagram_url" type="url" required
            placeholder="https://instagram.com/tuusuario"
            className="input-cream" />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
            TikTok
            <span className="text-xs font-medium" style={{ color: 'var(--brown-300)' }}>opcional</span>
          </label>
          <input name="tiktok_url" type="url"
            placeholder="https://tiktok.com/@tuusuario"
            className="input-cream" />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
            YouTube
            <span className="text-xs font-medium" style={{ color: 'var(--brown-300)' }}>opcional</span>
          </label>
          <input name="youtube_url" type="url"
            placeholder="https://youtube.com/@tucanal"
            className="input-cream" />
        </div>

        {/* Nota de tiempo */}
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>
            La verificación puede tardar hasta 48 horas. Te notificaremos cuando tu cuenta sea aprobada.
          </p>
        </div>

        <div className="pt-2 pb-8">
          <button type="submit" disabled={isPending}
            className="w-full font-semibold rounded-2xl py-3.5 text-sm transition-opacity"
            style={{ background: 'var(--amber)', color: '#000', opacity: isPending ? 0.6 : 1 }}>
            {isPending ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      </form>
    </div>
  )
}
