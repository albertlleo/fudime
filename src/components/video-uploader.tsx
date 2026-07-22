'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { getUploadSignature, getImageUploadSignature, createRecipe } from '@/app/(main)/subir/actions'

const CATEGORIES = [
  'Aperitivos', 'Entrantes', 'Ensaladas', 'Cremas y sopas', 'Platos de cuchara',
  'Pasta', 'Arroces', 'Verduras', 'Carne y aves', 'Pescado y marisco',
  'Plant Based', 'Huevos y tortillas', 'Panadería', 'Masas y hojaldres',
  'Comida internacional', 'Comida rápida', 'Bocadillos y sándwiches',
  'Postres y dulces', 'Salsas y aliños', 'Bebidas',
]
const CAT_EMOJIS: Record<string, string> = {
  'Aperitivos': '🥨', 'Entrantes': '🥗', 'Ensaladas': '🥙', 'Cremas y sopas': '🍲',
  'Platos de cuchara': '🫕', 'Pasta': '🍝', 'Arroces': '🍚', 'Verduras': '🥦',
  'Carne y aves': '🍗', 'Pescado y marisco': '🐟', 'Plant Based': '🌿',
  'Huevos y tortillas': '🍳', 'Panadería': '🍞', 'Masas y hojaldres': '🥐',
  'Comida internacional': '🌍', 'Comida rápida': '🍔', 'Bocadillos y sándwiches': '🥪',
  'Postres y dulces': '🍰', 'Salsas y aliños': '🫙', 'Bebidas': '🥤',
}
const DIETS = [
  { key: 'Vegana', emoji: '🌱' }, { key: 'Vegetariana', emoji: '🥕' },
  { key: 'Sin gluten', emoji: '🌾' }, { key: 'Sin lactosa', emoji: '🥛' },
]
const TIMES = [
  { key: 'menos-15', label: 'Menos de 15 min', emoji: '⚡' },
  { key: '15-30', label: '15–30 min', emoji: '🕐' },
  { key: '30-60', label: '30–60 min', emoji: '⏱️' },
  { key: 'mas-1h', label: 'Más de 1 hora', emoji: '🍳' },
]

type VideoState =
  | { status: 'idle' }
  | { status: 'preview'; file: File; blobUrl: string }
  | { status: 'uploading'; progress: number }
  | { status: 'done'; videoUrl: string; duration: number | null }
  | { status: 'error'; message: string }

type CoverState =
  | { status: 'idle' }
  | { status: 'cropping'; blobUrl: string; panX: number; panY: number; scale: number }
  | { status: 'uploading' }
  | { status: 'done'; url: string }
  | { status: 'error' }

function IconGrid({ options, selected, onToggle }: {
  options: { key: string; label: string; emoji: string }[]
  selected: string[]
  onToggle: (key: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(({ key, label, emoji }) => {
        const active = selected.includes(key)
        return (
          <button key={key} type="button" onClick={() => onToggle(key)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all text-left"
            style={{
              background: active ? 'var(--amber)' : '#fff',
              color: active ? '#000' : 'var(--brown-700)',
              border: `1.5px solid ${active ? 'var(--amber)' : 'var(--brown-100)'}`,
            }}>
            <span className="text-lg leading-none flex-shrink-0">{emoji}</span>
            <span className="leading-tight">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function VideoUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null)
  const pinchRef = useRef<{ dist: number; panX: number; panY: number; scale: number } | null>(null)

  const [videoState, setVideoState] = useState<VideoState>({ status: 'idle' })
  const [coverState, setCoverState] = useState<CoverState>({ status: 'idle' })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [diet, setDiet] = useState<string[]>([])
  const [cookTime, setCookTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Auto-generate cover thumbnail once video is uploaded
  useEffect(() => {
    if (videoState.status === 'done' && coverState.status === 'idle') {
      const autoThumb = videoState.videoUrl.replace('/upload/', '/upload/so_auto,w_1080,h_1920,c_fill,f_jpg/')
      setCoverState({ status: 'done', url: autoThumb })
    }
  }, [videoState.status])

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (videoState.status === 'preview') URL.revokeObjectURL(videoState.blobUrl)
      if (coverState.status === 'cropping') URL.revokeObjectURL(coverState.blobUrl)
    }
  }, [])

  // Non-passive touchmove for pinch+pan crop gestures
  useEffect(() => {
    const el = cropContainerRef.current
    if (!el || coverState.status !== 'cropping') return
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
    // Container is 210x280; max pan = half of "overflow" at current scale
    const maxPanX = (s: number) => 105 * (s - 1)
    const maxPanY = (s: number) => 140 * (s - 1)
    const onMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1 && panRef.current) {
        const dx = e.touches[0].clientX - panRef.current.startX
        const dy = e.touches[0].clientY - panRef.current.startY
        setCoverState(prev => {
          if (prev.status !== 'cropping') return prev
          return {
            ...prev,
            panX: clamp(panRef.current!.panX + dx, -maxPanX(prev.scale), maxPanX(prev.scale)),
            panY: clamp(panRef.current!.panY + dy, -maxPanY(prev.scale), maxPanY(prev.scale)),
          }
        })
      } else if (e.touches.length === 2 && pinchRef.current) {
        const newDist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY,
        )
        const newScale = clamp(pinchRef.current.scale * (newDist / pinchRef.current.dist), 1, 4)
        setCoverState(prev => {
          if (prev.status !== 'cropping') return prev
          return {
            ...prev,
            scale: newScale,
            panX: clamp(pinchRef.current!.panX, -maxPanX(newScale), maxPanX(newScale)),
            panY: clamp(pinchRef.current!.panY, -maxPanY(newScale), maxPanY(newScale)),
          }
        })
      }
    }
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [coverState.status])

  function handleVideoSelect(file: File) {
    if (!file.type.startsWith('video/')) {
      setVideoState({ status: 'error', message: 'El archivo debe ser un vídeo.' }); return
    }
    if (file.size > 100 * 1024 * 1024) {
      setVideoState({ status: 'error', message: 'El vídeo pesa más de 100 MB.' }); return
    }
    setVideoState({ status: 'preview', file, blobUrl: URL.createObjectURL(file) })
  }

  const uploadVideo = useCallback(async (file: File) => {
    setVideoState({ status: 'uploading', progress: 0 })
    try {
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
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setVideoState({ status: 'uploading', progress: Math.round(e.loaded / e.total * 100) })
        }
        xhr.onload = () => {
          if (xhr.status === 200) {
            const res = JSON.parse(xhr.responseText)
            setVideoState({ status: 'done', videoUrl: res.secure_url, duration: res.duration ? Math.round(res.duration) : null })
            resolve()
          } else {
            let msg = 'Error al subir el vídeo.'
            try { const e = JSON.parse(xhr.responseText); if (e?.error?.message) msg = e.error.message } catch {}
            setVideoState({ status: 'error', message: msg }); reject()
          }
        }
        xhr.onerror = () => { setVideoState({ status: 'error', message: 'Error de red.' }); reject() }
        xhr.send(fd)
      })
    } catch {}
  }, [])

  function handleCoverSelect(file: File) {
    if (!file.type.startsWith('image/')) return
    if (coverState.status === 'cropping') URL.revokeObjectURL(coverState.blobUrl)
    setCoverState({ status: 'cropping', blobUrl: URL.createObjectURL(file), panX: 0, panY: 0, scale: 1 })
  }

  async function confirmCrop() {
    if (coverState.status !== 'cropping') return
    const { blobUrl, panX, panY, scale } = coverState
    setCoverState({ status: 'uploading' })
    try {
      const img = new Image()
      img.src = blobUrl
      await new Promise<void>(r => { img.onload = () => r() })
      // Replicate object-fit:cover at canvas resolution (1080x1440 = 3:4)
      const targetW = 1080, targetH = 1440
      const imgAspect = img.naturalWidth / img.naturalHeight
      const targetAspect = targetW / targetH
      let drawW: number, drawH: number
      if (imgAspect > targetAspect) {
        drawH = targetH * scale
        drawW = drawH * imgAspect
      } else {
        drawW = targetW * scale
        drawH = drawW / imgAspect
      }
      // Scale pan from container (210x280) to canvas (1080x1440)
      const ratio = targetW / 210
      const x = (targetW - drawW) / 2 + panX * ratio
      const y = (targetH - drawH) / 2 + panY * ratio
      const canvas = document.createElement('canvas')
      canvas.width = targetW; canvas.height = targetH
      canvas.getContext('2d')!.drawImage(img, x, y, drawW, drawH)
      const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/jpeg', 0.92))
      URL.revokeObjectURL(blobUrl)
      const sig = await getImageUploadSignature()
      const fd = new FormData()
      fd.append('file', blob, 'cover.jpg')
      fd.append('api_key', sig.apiKey)
      fd.append('timestamp', String(sig.timestamp))
      fd.append('signature', sig.signature)
      fd.append('folder', sig.folder)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      setCoverState({ status: 'done', url: (await res.json()).secure_url })
    } catch { setCoverState({ status: 'error' }) }
  }

  function toggleCategory(c: string) { setCategories(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]) }
  function toggleDiet(d: string) { setDiet(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]) }
  function toggleTime(k: string) { setCookTime(p => p === k ? '' : k) }

  const handleSubmit = async (publish: boolean) => {
    if (videoState.status !== 'done' || !title.trim()) return
    setSubmitting(true); setSubmitError(null)
    const result = await createRecipe({
      title, description,
      videoUrl: videoState.videoUrl,
      thumbnailUrl: coverState.status === 'done' ? coverState.url : '',
      durationSeconds: videoState.duration,
      tags: categories.map(c => c.toLowerCase()),
      diet: diet.map(d => d.toLowerCase()),
      cookTime: cookTime || null,
      publish,
    })
    if (result?.error) { setSubmitError(result.error); setSubmitting(false) }
  }

  const canSubmit = videoState.status === 'done' && !!title.trim() && !!description.trim()
    && categories.length > 0 && !!cookTime && !submitting

  return (
    <div className="min-h-dvh overflow-y-auto pb-24 px-5 pt-14" style={{ background: 'var(--cream)' }}>
      <h1 className="text-2xl font-black mb-6" style={{ color: 'var(--brown-900)' }}>Subir receta</h1>

      {/* ── Vídeo ── */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-700)' }}>
          Vídeo <span style={{ color: '#dc2626' }}>*</span>
        </label>

        {(videoState.status === 'idle' || videoState.status === 'error') && (
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-3xl h-44 flex flex-col items-center justify-center transition-all"
            style={{ border: '2px dashed var(--brown-300)', background: '#fff' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
              className="w-8 h-8 mb-2" style={{ color: 'var(--brown-500)' }}>
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <p className="text-sm font-semibold" style={{ color: 'var(--brown-700)' }}>Seleccionar de la galería</p>
            <p className="text-xs mt-1" style={{ color: 'var(--brown-300)' }}>Máx. 100 MB · formato 9:16 recomendado</p>
            {videoState.status === 'error' && (
              <p className="text-xs mt-3 px-6 text-center" style={{ color: '#dc2626' }}>{videoState.message}</p>
            )}
          </button>
        )}

        {videoState.status === 'preview' && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--brown-100)' }}>
            <div className="relative bg-black" style={{ aspectRatio: '9/16', maxHeight: '60vh' }}>
              <video src={videoState.blobUrl} className="w-full h-full object-contain"
                controls playsInline muted />
            </div>
            <div className="flex gap-2 p-3" style={{ background: '#fff' }}>
              <button type="button"
                onClick={() => { URL.revokeObjectURL(videoState.blobUrl); setVideoState({ status: 'idle' }) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--brown-100)', color: 'var(--brown-700)' }}>
                Elegir otro
              </button>
              <button type="button" onClick={() => uploadVideo(videoState.file)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--amber)', color: '#000' }}>
                Subir este vídeo ↑
              </button>
            </div>
          </div>
        )}

        {videoState.status === 'uploading' && (
          <div className="rounded-3xl p-6" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--brown-700)' }}>Subiendo vídeo...</p>
              <p className="text-sm font-black" style={{ color: 'var(--amber)' }}>{videoState.progress}%</p>
            </div>
            <div className="w-full rounded-full h-2" style={{ background: 'var(--brown-100)' }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${videoState.progress}%`, background: 'var(--amber)' }} />
            </div>
          </div>
        )}

        {videoState.status === 'done' && (
          <div className="rounded-3xl p-4 flex items-center gap-3"
            style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            <p className="flex-1 text-sm font-semibold flex items-center gap-1.5" style={{ color: '#16a34a' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14l-4-4 1.414-1.414L11 13.172l4.586-4.586L17 10l-6 6z" />
              </svg>
              Vídeo subido
              {videoState.duration && (
                <span className="font-normal ml-1" style={{ color: 'var(--brown-500)' }}>
                  · {Math.floor(videoState.duration / 60)}:{String(videoState.duration % 60).padStart(2, '0')} min
                </span>
              )}
            </p>
            <button onClick={() => { setVideoState({ status: 'idle' }); setCoverState({ status: 'idle' }); setTitle(''); setDescription('') }}
              style={{ color: 'var(--brown-300)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoSelect(f); e.target.value = '' }} />
      </div>

      {/* ── Portada / Crop ── */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-700)' }}>
          Foto de portada
          <span className="font-normal ml-1" style={{ color: 'var(--brown-300)' }}>· recorte 3:4 automático</span>
        </label>

        {coverState.status === 'cropping' ? (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--brown-100)' }}>
            {/* Crop preview: fixed 210×280 px */}
            <div className="flex justify-center py-3" style={{ background: '#1a1a1a' }}>
              <div ref={cropContainerRef}
                className="relative overflow-hidden"
                style={{ width: 210, height: 280, touchAction: 'none', userSelect: 'none' }}
                onTouchStart={e => {
                  if (e.touches.length === 1) {
                    panRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, panX: coverState.panX, panY: coverState.panY }
                    pinchRef.current = null
                  } else if (e.touches.length === 2) {
                    const dist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY)
                    pinchRef.current = { dist, panX: coverState.panX, panY: coverState.panY, scale: coverState.scale }
                    panRef.current = null
                  }
                }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverState.blobUrl}
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `translate(${coverState.panX}px, ${coverState.panY}px) scale(${coverState.scale})`,
                    transformOrigin: 'center',
                    pointerEvents: 'none',
                  }}
                />
                {/* Rule-of-thirds grid */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
                    backgroundSize: '33.33% 33.33%',
                  }} />
              </div>
            </div>
            <p className="text-center text-[11px] py-1.5" style={{ background: '#111', color: 'rgba(255,255,255,0.45)' }}>
              Mueve con 1 dedo · Pellizca para ampliar
            </p>

            {/* Confirm / Cancel */}
            <div className="px-3 py-3 flex items-center gap-2 justify-end" style={{ background: '#fff' }}>
              <button type="button"
                onClick={() => { URL.revokeObjectURL(coverState.blobUrl); setCoverState({ status: 'idle' }) }}
                className="h-9 px-3 rounded-xl text-xs font-medium"
                style={{ background: 'var(--brown-100)', color: 'var(--brown-500)' }}>
                Cancelar
              </button>
              <button type="button" onClick={confirmCrop}
                className="h-9 px-4 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--amber)', color: '#000' }}>
                Confirmar
              </button>
            </div>
          </div>

        ) : (
          <button type="button" onClick={() => coverInputRef.current?.click()}
            className="w-full rounded-2xl overflow-hidden relative flex items-center justify-center"
            style={{ height: 120, background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            {coverState.status === 'done' ? (
              <>
                <img src={coverState.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.35)' }}>
                  <span className="text-white text-xs font-semibold">Cambiar</span>
                </div>
              </>
            ) : coverState.status === 'uploading' ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--brown-100)', borderTopColor: 'var(--amber)' }} />
                <p className="text-xs" style={{ color: 'var(--brown-500)' }}>Procesando portada...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                  className="w-7 h-7" style={{ color: 'var(--brown-300)' }}>
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <p className="text-xs" style={{ color: 'var(--brown-500)' }}>
                  {coverState.status === 'error' ? 'Error al subir. Toca para reintentar' : 'Toca para subir portada'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--brown-300)' }}>Se genera automáticamente si no subes ninguna</p>
              </div>
            )}
          </button>
        )}

        <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverSelect(f); e.target.value = '' }} />
      </div>

      {/* ── Formulario ── */}
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
            Ingredientes y paso a paso <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            rows={5} placeholder="Lista de ingredientes, pasos de la receta, trucos..."
            className="input-cream resize-none" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-700)' }}>
            Categoría <span style={{ color: '#dc2626' }}>*</span> <span className="font-normal" style={{ color: 'var(--brown-300)' }}>(puedes elegir varias)</span>
          </label>
          <IconGrid
            options={CATEGORIES.map(c => ({ key: c, label: c, emoji: CAT_EMOJIS[c] ?? '🍴' }))}
            selected={categories}
            onToggle={toggleCategory}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-700)' }}>
            Tiempo de cocinado <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <IconGrid
            options={TIMES.map(t => ({ key: t.key, label: t.label, emoji: t.emoji }))}
            selected={cookTime ? [cookTime] : []}
            onToggle={toggleTime}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-700)' }}>
            Dieta e intolerancias <span className="font-normal ml-1" style={{ color: 'var(--brown-300)' }}>(opcional)</span>
          </label>
          <IconGrid
            options={DIETS.map(d => ({ key: d.key, label: d.key, emoji: d.emoji }))}
            selected={diet}
            onToggle={toggleDiet}
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
