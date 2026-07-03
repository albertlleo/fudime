'use client'

import { useTransition, useState } from 'react'
import { updateProfile } from '../actions'
import type { User } from '@/lib/types'

export default function EditForm({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateProfile(formData)
        setSuccess(true)
      } catch {
        setError('Error al guardar los cambios. Inténtalo de nuevo.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 space-y-4">
      {error && (
        <div className="rounded-2xl p-3.5" style={{ background: '#fff5f5', border: '1.5px solid #fca5a5' }}>
          <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-2xl p-3.5" style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}>
          <p className="text-sm" style={{ color: '#166534' }}>Cambios guardados correctamente.</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
          Nombre
        </label>
        <input name="display_name" type="text" required maxLength={50}
          defaultValue={user.display_name} className="input-cream" />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
          Bio
        </label>
        <textarea name="bio" defaultValue={user.bio ?? ''} maxLength={200} rows={3}
          placeholder="Cuéntanos algo sobre ti..."
          className="input-cream resize-none" />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
          Foto de perfil <span className="font-normal" style={{ color: 'var(--brown-300)' }}>(URL)</span>
        </label>
        <input name="avatar_url" type="url" defaultValue={user.avatar_url ?? ''}
          placeholder="https://..." className="input-cream" />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
          Instagram
        </label>
        <input name="instagram_url" type="url" defaultValue={user.instagram_url ?? ''}
          placeholder="https://instagram.com/tuusuario" className="input-cream" />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
          TikTok
        </label>
        <input name="tiktok_url" type="url" defaultValue={user.tiktok_url ?? ''}
          placeholder="https://tiktok.com/@tuusuario" className="input-cream" />
      </div>

      <div className="pt-2 pb-6">
        <button type="submit" disabled={isPending}
          className="w-full font-semibold rounded-2xl py-3.5 text-sm transition-opacity"
          style={{ background: 'var(--amber)', color: '#000', opacity: isPending ? 0.6 : 1 }}>
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
