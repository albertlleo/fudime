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
          Comparte tus redes sociales para que podamos validar tu cuenta como creador.
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
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
            <span className="mr-2">📸</span>Instagram
          </label>
          <input name="instagram_url" type="url"
            placeholder="https://instagram.com/tuusuario"
            className="input-cream" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
            <span className="mr-2">🎵</span>TikTok
          </label>
          <input name="tiktok_url" type="url"
            placeholder="https://tiktok.com/@tuusuario"
            className="input-cream" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
            <span className="mr-2">🔗</span>Otros enlaces
          </label>
          <textarea name="other_links" rows={3}
            placeholder="YouTube, web personal, otros perfiles..."
            className="input-cream resize-none" />
          <p className="text-xs mt-1.5" style={{ color: 'var(--brown-300)' }}>
            Añade al menos un enlace
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
