'use client'

import { useTransition, useState } from 'react'
import { updateProfile } from '../actions'
import type { User } from '@/lib/types'

export default function EditForm({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateProfile(formData)
      } catch {
        setError('Error al guardar los cambios. Inténtalo de nuevo.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">Nombre</label>
        <input
          name="display_name"
          type="text"
          defaultValue={user.display_name}
          required
          maxLength={50}
          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">Bio</label>
        <textarea
          name="bio"
          defaultValue={user.bio ?? ''}
          maxLength={200}
          rows={3}
          placeholder="Cuéntanos algo sobre ti..."
          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">Foto de perfil (URL)</label>
        <input
          name="avatar_url"
          type="url"
          defaultValue={user.avatar_url ?? ''}
          placeholder="https://..."
          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">Instagram</label>
        <input
          name="instagram_url"
          type="url"
          defaultValue={user.instagram_url ?? ''}
          placeholder="https://instagram.com/tuusuario"
          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">TikTok</label>
        <input
          name="tiktok_url"
          type="url"
          defaultValue={user.tiktok_url ?? ''}
          placeholder="https://tiktok.com/@tuusuario"
          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
        />
      </div>

      <div className="pt-2 pb-6">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl py-3 text-sm transition-colors"
        >
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
