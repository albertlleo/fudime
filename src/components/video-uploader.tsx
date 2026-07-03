'use client'

import { useRef, useState, useCallback } from 'react'
import { getUploadSignature, createRecipe } from '@/app/(main)/subir/actions'

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'done'; videoUrl: string; thumbnailUrl: string; duration: number | null }
  | { status: 'error'; message: string }

export default function VideoUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [upload, setUpload] = useState<UploadState>({ status: 'idle' })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setUpload({ status: 'error', message: 'El archivo debe ser un vídeo.' })
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      setUpload({ status: 'error', message: 'El vídeo pesa más de 100 MB. Recórtalo o baja la calidad antes de subir.' })
      return
    }

    setUpload({ status: 'uploading', progress: 0 })

    const sig = await getUploadSignature()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', sig.apiKey)
    formData.append('timestamp', String(sig.timestamp))
    formData.append('signature', sig.signature)
    formData.append('folder', sig.folder)

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          setUpload({ status: 'uploading', progress: Math.round((e.loaded / e.total) * 100) })
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText)
          const thumbUrl = res.secure_url.replace('/upload/', '/upload/so_auto,w_400,h_600,c_fill,f_jpg/')
          setUpload({ status: 'done', videoUrl: res.secure_url, thumbnailUrl: thumbUrl, duration: res.duration ? Math.round(res.duration) : null })
          resolve()
        } else {
          let msg = 'Error al subir el vídeo.'
          try { const err = JSON.parse(xhr.responseText); if (err?.error?.message) msg = err.error.message } catch {}
          setUpload({ status: 'error', message: msg })
          reject()
        }
      }

      xhr.onerror = () => { setUpload({ status: 'error', message: 'Error de red al conectar con Cloudinary.' }); reject() }
      xhr.send(formData)
    }).catch(() => {})
  }, [])

  const handleFile = useCallback((file: File | undefined) => {
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleSubmit = async (publish: boolean) => {
    if (upload.status !== 'done' || !title.trim()) return
    setSubmitting(true)
    setSubmitError(null)

    const tags = tagsInput.split(',').map(t => t.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean)

    const result = await createRecipe({
      title, description, videoUrl: upload.videoUrl,
      thumbnailUrl: upload.thumbnailUrl, durationSeconds: upload.duration, tags, publish,
    })

    if (result?.error) { setSubmitError(result.error); setSubmitting(false) }
  }

  return (
    <div className="min-h-dvh pb-24 px-5 pt-14 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <h1 className="text-2xl font-black mb-6" style={{ color: 'var(--brown-900)' }}>Subir receta</h1>

      {/* Video picker */}
      {upload.status === 'idle' || upload.status === 'error' ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="rounded-3xl h-52 flex flex-col items-center justify-center cursor-pointer transition-all mb-6"
          style={{
            border: `2px dashed ${dragOver ? 'var(--amber)' : 'var(--brown-300)'}`,
            background: dragOver ? '#fffbeb' : '#fff',
          }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'var(--cream)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
              className="w-7 h-7" style={{ color: 'var(--brown-500)' }}>
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--brown-700)' }}>Toca para seleccionar vídeo</p>
          <p className="text-xs mt-1" style={{ color: 'var(--brown-300)' }}>o arrastra aquí · máx. 100 MB</p>
          {upload.status === 'error' && (
            <p className="text-xs mt-3 px-6 text-center" style={{ color: '#dc2626' }}>{upload.message}</p>
          )}
        </div>

      ) : upload.status === 'uploading' ? (
        <div className="rounded-3xl p-6 mb-6" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--brown-700)' }}>Subiendo vídeo...</p>
            <p className="text-sm font-black" style={{ color: 'var(--amber)' }}>{upload.progress}%</p>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: 'var(--brown-100)' }}>
            <div className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${upload.progress}%`, background: 'var(--amber)' }} />
          </div>
        </div>

      ) : (
        <div className="rounded-3xl p-4 mb-6 flex items-center gap-4"
          style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: 'var(--cream)' }}>
            {upload.thumbnailUrl && (
              <img src={upload.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#16a34a' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14l-4-4 1.414-1.414L11 13.172l4.586-4.586L17 10l-6 6z"/>
              </svg>
              Vídeo subido
            </p>
            {upload.duration && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--brown-500)' }}>
                {Math.floor(upload.duration / 60)}:{String(upload.duration % 60).padStart(2, '0')} min
              </p>
            )}
          </div>
          <button onClick={() => { setUpload({ status: 'idle' }); setTitle(''); setDescription('') }}
            className="transition-colors flex-shrink-0" style={{ color: 'var(--brown-300)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])} />

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
            Título <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            maxLength={80} placeholder="¿Qué receta es?" className="input-cream" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
            Etiquetas{' '}
            <span className="font-normal" style={{ color: 'var(--brown-300)' }}>(separadas por coma)</span>
          </label>
          <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
            placeholder="pasta, italiana, fácil..." className="input-cream" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
            Descripción
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            maxLength={300} rows={3} placeholder="Ingredientes principales, trucos, notas..."
            className="input-cream resize-none" />
        </div>

        {submitError && (
          <p className="text-sm" style={{ color: '#dc2626' }}>{submitError}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleSubmit(false)}
            disabled={upload.status !== 'done' || !title.trim() || submitting}
            className="flex-1 font-medium rounded-2xl py-3.5 text-sm transition-colors"
            style={{
              background: '#fff',
              border: '1.5px solid var(--brown-100)',
              color: 'var(--brown-700)',
              opacity: upload.status !== 'done' || !title.trim() || submitting ? 0.4 : 1,
            }}
          >
            Guardar borrador
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={upload.status !== 'done' || !title.trim() || submitting}
            className="flex-1 font-semibold rounded-2xl py-3.5 text-sm transition-colors"
            style={{
              background: 'var(--amber)',
              color: '#000',
              opacity: upload.status !== 'done' || !title.trim() || submitting ? 0.4 : 1,
            }}
          >
            {submitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}
