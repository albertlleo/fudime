'use client'

import { useRef, useState, useCallback } from 'react'
import { getUploadSignature, getImageUploadSignature, createRecipe } from '@/app/(main)/subir/actions'

const CATEGORIES = [
  'Aperitivos', 'Entrantes', 'Ensaladas', 'Cremas y sopas', 'Platos de cuchara',
  'Pasta', 'Arroces', 'Verduras', 'Carne y aves', 'Pescado y marisco',
  'Plant Based', 'Huevos y tortillas', 'Panadería', 'Masas y hojaldres',
  'Comida internacional', 'Comida rápida', 'Bocadillos y sándwiches',
  'Postres y dulces', 'Salsas y aliños', 'Bebidas',
]

const DIETS = ['Vegana', 'Vegetariana', 'Sin gluten', 'Sin lactosa', 'Sin azúcar']
const TIMES = [
  { key: 'menos-15', label: 'Menos de 15 min' },
  { key: '15-30', label: '15–30 min' },
  { key: '30-60', label: '30–60 min' },
  { key: 'mas-1h', label: 'Más de 1 hora' },
]

type VideoUploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'done'; videoUrl: string; duration: number | null }
  | { status: 'error'; message: string }

type CoverState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'done'; url: string }
  | { status: 'error' }

function PillSelect({ options, selected, onToggle, single }: {
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
  single?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className="px-3.5 py-1.5 rounded-2xl text-sm font-medium transition-all"
            style={{
              background: active ? 'var(--brown-900)' : '#fff',
              color: active ? '#fff' : 'var(--brown-700)',
              border: `1.5px solid ${active ? 'var(--brown-900)' : 'var(--brown-100)'}`,
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export default function VideoUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [videoUpload, setVideoUpload] = useState<VideoUploadState>({ status: 'idle' })
  const [cover, setCover] = useState<CoverState>({ status: 'idle' })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [diet, setDiet] = useState<string[]>([])
  const [cookTime, setCookTime] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const uploadVideo = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setVideoUpload({ status: 'error', message: 'El archivo debe ser un vídeo.' })
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      setVideoUpload({ status: 'error', message: 'El vídeo pesa más de 100 MB.' })
      return
    }
    setVideoUpload({ status: 'uploading', progress: 0 })
    const sig = await getUploadSignature()
    const fd = new FormData()
    fd.append('file', file)
    fd.append('api_key', sig.apiKey)
    fd.append('timestamp', String(sig.timestamp))
    fd.append('signature', sig.signature)
    fd.append('folder', sig.folder)

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          setVideoUpload({ status: 'uploading', progress: Math.round((e.loaded / e.total) * 100) })
      }
      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText)
          setVideoUpload({ status: 'done', videoUrl: res.secure_url, duration: res.duration ? Math.round(res.duration) : null })
          // Auto-generate cover if none uploaded
          if (cover.status === 'idle') {
            const autoThumb = res.secure_url.replace('/upload/', '/upload/so_auto,w_1080,h_1920,c_fill,f_jpg/')
            setCover({ status: 'done', url: autoThumb })
          }
          resolve()
        } else {
          let msg = 'Error al subir el vídeo.'
          try { const e = JSON.parse(xhr.responseText); if (e?.error?.message) msg = e.error.message } catch {}
          setVideoUpload({ status: 'error', message: msg })
          reject()
        }
      }
      xhr.onerror = () => { setVideoUpload({ status: 'error', message: 'Error de red.' }); reject() }
      xhr.send(fd)
    }).catch(() => {})
  }, [cover.status])

  async function uploadCover(file: File) {
    if (!file.type.startsWith('image/')) return
    setCover({ status: 'uploading' })
    try {
      const sig = await getImageUploadSignature()
      const fd = new FormData()
      fd.append('file', file)
      fd.append('api_key', sig.apiKey)
      fd.append('timestamp', String(sig.timestamp))
      fd.append('signature', sig.signature)
      fd.append('folder', sig.folder)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setCover({ status: 'done', url: json.secure_url })
    } catch {
      setCover({ status: 'error' })
    }
  }

  function toggleCategory(cat: string) {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }
  function toggleDiet(d: string) {
    setDiet(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  function toggleTime(key: string) {
    setCookTime(prev => prev === key ? '' : key)
  }

  const handleSubmit = async (publish: boolean) => {
    if (videoUpload.status !== 'done' || !title.trim()) return
    setSubmitting(true)
    setSubmitError(null)

    const result = await createRecipe({
      title,
      description,
      videoUrl: videoUpload.videoUrl,
      thumbnailUrl: cover.status === 'done' ? cover.url : '',
      durationSeconds: videoUpload.duration,
      tags: categories.map(c => c.toLowerCase()),
      diet: diet.map(d => d.toLowerCase()),
      cookTime: cookTime || null,
      publish,
    })

    if (result?.error) { setSubmitError(result.error); setSubmitting(false) }
  }

  const canSubmit = videoUpload.status === 'done' && !!title.trim() && !submitting

  return (
    <div className="h-dvh overflow-y-auto pb-24 px-5 pt-14" style={{ background: 'var(--cream)' }}>
      <h1 className="text-2xl font-black mb-6" style={{ color: 'var(--brown-900)' }}>Subir receta</h1>

      {/* Video picker */}
      {videoUpload.status === 'idle' || videoUpload.status === 'error' ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadVideo(e.dataTransfer.files[0]) }}
          className="rounded-3xl h-44 flex flex-col items-center justify-center cursor-pointer transition-all mb-3"
          style={{ border: `2px dashed ${dragOver ? 'var(--amber)' : 'var(--brown-300)'}`, background: dragOver ? '#fffbeb' : '#fff' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
            className="w-8 h-8 mb-2" style={{ color: 'var(--brown-500)' }}>
            <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          <p className="text-sm font-semibold" style={{ color: 'var(--brown-700)' }}>Toca para seleccionar vídeo</p>
          <p className="text-xs mt-1" style={{ color: 'var(--brown-300)' }}>Resolución recomendada: 1080×1920 · máx. 100 MB</p>
          {videoUpload.status === 'error' && (
            <p className="text-xs mt-3 px-6 text-center" style={{ color: '#dc2626' }}>{videoUpload.message}</p>
          )}
        </div>
      ) : videoUpload.status === 'uploading' ? (
        <div className="rounded-3xl p-6 mb-3" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--brown-700)' }}>Subiendo vídeo...</p>
            <p className="text-sm font-black" style={{ color: 'var(--amber)' }}>{videoUpload.progress}%</p>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: 'var(--brown-100)' }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${videoUpload.progress}%`, background: 'var(--amber)' }} />
          </div>
        </div>
      ) : (
        <div className="rounded-3xl p-4 mb-3 flex items-center gap-3"
          style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <div className="flex-1">
            <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#16a34a' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14l-4-4 1.414-1.414L11 13.172l4.586-4.586L17 10l-6 6z"/>
              </svg>
              Vídeo subido
            </p>
            {videoUpload.duration && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--brown-500)' }}>
                {Math.floor(videoUpload.duration / 60)}:{String(videoUpload.duration % 60).padStart(2, '0')} min
              </p>
            )}
          </div>
          <button onClick={() => { setVideoUpload({ status: 'idle' }); setCover({ status: 'idle' }); setTitle(''); setDescription('') }}
            style={{ color: 'var(--brown-300)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
        onChange={(e) => uploadVideo(e.target.files![0])} />

      {/* Cover photo */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-700)' }}>
          Foto de portada
          <span className="font-normal ml-1" style={{ color: 'var(--brown-300)' }}>(1080×1920 px)</span>
        </label>
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="w-full rounded-2xl overflow-hidden relative flex items-center justify-center transition-all"
          style={{ height: 120, background: '#fff', border: '1.5px solid var(--brown-100)' }}
        >
          {cover.status === 'done' ? (
            <img src={cover.url} alt="" className="w-full h-full object-cover" />
          ) : cover.status === 'uploading' ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--brown-100)', borderTopColor: 'var(--amber)' }} />
              <p className="text-xs" style={{ color: 'var(--brown-500)' }}>Subiendo foto...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                className="w-7 h-7" style={{ color: 'var(--brown-300)' }}>
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <p className="text-xs" style={{ color: 'var(--brown-500)' }}>
                {cover.status === 'error' ? 'Error al subir. Toca para reintentar' : 'Toca para subir portada'}
              </p>
            </div>
          )}
        </button>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f) }} />
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
            Título <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            maxLength={80} placeholder="¿Qué receta es?" className="input-cream" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--brown-700)' }}>
            Ingredientes y paso a paso
          </label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            rows={5} placeholder="Lista de ingredientes, pasos de la receta, trucos..."
            className="input-cream resize-none" />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-700)' }}>
            Categoría <span className="font-normal" style={{ color: 'var(--brown-300)' }}>(puedes elegir varias)</span>
          </label>
          <PillSelect options={CATEGORIES} selected={categories} onToggle={toggleCategory} />
        </div>

        {/* Dieta */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-700)' }}>
            Dieta e intolerancias
          </label>
          <PillSelect options={DIETS} selected={diet} onToggle={toggleDiet} />
        </div>

        {/* Tiempo */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-700)' }}>
            Tiempo de cocinado
          </label>
          <PillSelect
            options={TIMES.map(t => t.label)}
            selected={cookTime ? [TIMES.find(t => t.key === cookTime)?.label ?? ''] : []}
            onToggle={(label) => {
              const found = TIMES.find(t => t.label === label)
              if (found) toggleTime(found.key)
            }}
            single
          />
        </div>

        {submitError && <p className="text-sm" style={{ color: '#dc2626' }}>{submitError}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={() => handleSubmit(false)} disabled={!canSubmit}
            className="flex-1 font-medium rounded-2xl py-3.5 text-sm"
            style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)', opacity: !canSubmit ? 0.4 : 1 }}>
            Borrador
          </button>
          <button onClick={() => handleSubmit(true)} disabled={!canSubmit}
            className="flex-1 font-semibold rounded-2xl py-3.5 text-sm"
            style={{ background: 'var(--amber)', color: '#000', opacity: !canSubmit ? 0.4 : 1 }}>
            {submitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}
