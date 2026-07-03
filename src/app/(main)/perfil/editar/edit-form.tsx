'use client'

import { useTransition, useState, useRef } from 'react'
import { updateProfile } from '../actions'
import { getImageUploadSignature } from '@/app/(main)/subir/actions'
import type { User } from '@/lib/types'

export default function EditForm({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = user.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const sig = await getImageUploadSignature()
      const fd = new FormData()
      fd.append('file', file)
      fd.append('api_key', sig.apiKey)
      fd.append('timestamp', String(sig.timestamp))
      fd.append('signature', sig.signature)
      fd.append('folder', sig.folder)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const json = await res.json()
      setAvatarUrl(json.secure_url)
    } catch {
      setError('Error al subir la foto. Inténtalo de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    formData.set('avatar_url', avatarUrl)
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
    <form onSubmit={handleSubmit} className="px-5 space-y-5">
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

      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-24 h-24 rounded-2xl object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-black text-black"
              style={{ background: 'var(--amber)' }}>
              {initials}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-opacity"
            style={{ background: '#fff', border: '2px solid var(--brown-100)', opacity: uploading ? 0.6 : 1 }}
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--brown-100)', borderTopColor: 'var(--amber)' }} />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4" style={{ color: 'var(--brown-700)' }}>
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <p className="text-xs" style={{ color: 'var(--brown-300)' }}>
          {uploading ? 'Subiendo...' : 'Toca para cambiar la foto'}
        </p>
      </div>

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

      <div className="pt-2 pb-8">
        <button type="submit" disabled={isPending || uploading}
          className="w-full font-semibold rounded-2xl py-3.5 text-sm transition-opacity"
          style={{ background: 'var(--amber)', color: '#000', opacity: isPending || uploading ? 0.6 : 1 }}>
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
