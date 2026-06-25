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
  const isDragging = useRef(false)
  const [dragOver, setDragOver] = useState(false)

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setUpload({ status: 'error', message: 'El archivo debe ser un vídeo.' })
      return
    }
    const MAX_MB = 100
    if (file.size > MAX_MB * 1024 * 1024) {
      setUpload({ status: 'error', message: `El vídeo pesa más de ${MAX_MB} MB. Recórtalo o baja la calidad antes de subir.` })
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
        if (e.lengthComputable) {
          setUpload({ status: 'uploading', progress: Math.round((e.loaded / e.total) * 100) })
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText)
          const thumbUrl = res.secure_url.replace('/upload/', '/upload/so_auto,w_400,h_600,c_fill,f_jpg/')
          setUpload({
            status: 'done',
            videoUrl: res.secure_url,
            thumbnailUrl: thumbUrl,
            duration: res.duration ? Math.round(res.duration) : null,
          })
          resolve()
        } else {
          let msg = 'Error al subir el vídeo.'
          try {
            const err = JSON.parse(xhr.responseText)
            if (err?.error?.message) msg = err.error.message
          } catch {}
          setUpload({ status: 'error', message: msg })
          reject()
        }
      }

      xhr.onerror = () => {
        setUpload({ status: 'error', message: 'Error de red al conectar con Cloudinary.' })
        reject()
      }

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

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
      .filter(Boolean)

    const result = await createRecipe({
      title,
      description,
      videoUrl: upload.videoUrl,
      thumbnailUrl: upload.thumbnailUrl,
      durationSeconds: upload.duration,
      tags,
      publish,
    })

    if (result?.error) {
      setSubmitError(result.error)
      setSubmitting(false)
      return
    }
  }

  return (
    <div className="min-h-dvh pb-24 px-4 pt-8 overflow-y-auto">
      <h1 className="text-xl font-bold text-stone-900 mb-6">Subir receta</h1>

      {/* Video picker */}
      {upload.status === 'idle' || upload.status === 'error' ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl h-52 flex flex-col items-center justify-center cursor-pointer transition-colors mb-6 ${
            dragOver ? 'border-amber-500 bg-amber-500/10' : 'border-stone-300 hover:border-stone-300'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-stone-500 mb-3">
            <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          <p className="text-stone-500 text-sm font-medium">Toca para seleccionar vídeo</p>
          <p className="text-stone-600 text-xs mt-1">o arrastra aquí · máx. 100 MB</p>
          {upload.status === 'error' && (
            <p className="text-red-400 text-xs mt-3 px-4 text-center">{upload.message}</p>
          )}
        </div>
      ) : upload.status === 'uploading' ? (
        <div className="bg-white rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-stone-900 text-sm font-medium">Subiendo vídeo...</p>
            <p className="text-stone-500 text-sm font-bold">{upload.progress}%</p>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-16 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
            {upload.thumbnailUrl && (
              <img src={upload.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-green-400 text-sm font-semibold flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14l-4-4 1.414-1.414L11 13.172l4.586-4.586L17 10l-6 6z"/></svg>
              Vídeo subido
            </p>
            {upload.duration && (
              <p className="text-stone-500 text-xs mt-0.5">{Math.floor(upload.duration / 60)}:{String(upload.duration % 60).padStart(2, '0')} min</p>
            )}
          </div>
          <button
            onClick={() => { setUpload({ status: 'idle' }); setTitle(''); setDescription('') }}
            className="text-stone-600 hover:text-stone-500 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Título <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="¿Qué receta es?"
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Etiquetas
            <span className="text-stone-400 font-normal ml-1">(separadas por coma)</span>
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="pasta, italiana, fácil..."
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Ingredientes principales, trucos, notas..."
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm resize-none"
          />
        </div>

        {submitError && (
          <p className="text-red-400 text-sm">{submitError}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleSubmit(false)}
            disabled={upload.status !== 'done' || !title.trim() || submitting}
            className="flex-1 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-stone-900 font-medium rounded-xl py-3 text-sm transition-colors"
          >
            Guardar borrador
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={upload.status !== 'done' || !title.trim() || submitting}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {submitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}
