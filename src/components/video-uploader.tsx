'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { getUploadSignature, getImageUploadSignature, createRecipe } from '@/app/(main)/subir/actions'
import { CATEGORIES, CAT_EMOJIS, DIETS, TIMES } from '@/lib/categories'

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image()
  image.src = imageSrc
  await new Promise(r => { image.onload = r })
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.92))
}

type VideoState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'done'; videoUrl: string; duration: number | null }
  | { status: 'error'; message: string }

type CoverState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'done'; url: string }
  | { status: 'error' }

function Chip({ label, emoji, active, onClick }: { label: string; emoji: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
      style={{
        background: active ? 'var(--amber)' : 'transparent',
        color: active ? '#000' : 'var(--brown-600)',
        border: `1.5px solid ${active ? 'var(--amber)' : 'var(--brown-100)'}`,
      }}>
      <span className="text-base leading-none">{emoji}</span>
      <span className="leading-none whitespace-nowrap">{label}</span>
    </button>
  )
}

export default function VideoUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const videoBlobUrlRef = useRef<string | null>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const [step, setStep] = useState<1 | 2>(1)
  const [videoState, setVideoState] = useState<VideoState>({ status: 'idle' })
  const [coverState, setCoverState] = useState<CoverState>({ status: 'idle' })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [diet, setDiet] = useState<string[]>([])
  const [cookTime, setCookTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [cropAspect, setCropAspect] = useState<number | undefined>(4 / 5)
  const onCropComplete = useCallback((_: Area, pixels: Area) => { setCroppedAreaPixels(pixels) }, [])

  useEffect(() => {
    if (videoState.status === 'done' && coverState.status === 'idle') {
      const autoThumb = (videoState as { status: 'done'; videoUrl: string; duration: number | null }).videoUrl
        .replace('/upload/', '/upload/so_auto,w_1080,h_1920,c_fill,f_jpg/')
      setCoverState({ status: 'done', url: autoThumb })
    }
  }, [videoState.status])

  useEffect(() => {
    return () => { if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl) }
  }, [])

  function resetVideo() {
    xhrRef.current?.abort()
    xhrRef.current = null
    if (videoBlobUrlRef.current) { URL.revokeObjectURL(videoBlobUrlRef.current); videoBlobUrlRef.current = null }
    if (coverPreviewUrl) { URL.revokeObjectURL(coverPreviewUrl); setCoverPreviewUrl(null) }
    setVideoState({ status: 'idle' })
    setCoverState({ status: 'idle' })
  }

  function handleVideoSelect(file: File) {
    if (!file.type.startsWith('video/')) {
      setVideoState({ status: 'error', message: 'El archivo debe ser un vídeo.' }); return
    }
    if (file.size > 100 * 1024 * 1024) {
      setVideoState({ status: 'error', message: 'El vídeo pesa más de 100 MB.' }); return
    }
    if (videoBlobUrlRef.current) URL.revokeObjectURL(videoBlobUrlRef.current)
    videoBlobUrlRef.current = URL.createObjectURL(file)
    uploadVideo(file)
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
        xhrRef.current = xhr
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`)
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setVideoState({ status: 'uploading', progress: Math.round(e.loaded / e.total * 100) })
        }
        xhr.onload = () => {
          xhrRef.current = null
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
        xhr.onerror = () => { xhrRef.current = null; setVideoState({ status: 'error', message: 'Error de red.' }); reject() }
        xhr.onabort = () => { xhrRef.current = null; reject() }
        xhr.send(fd)
      })
    } catch {}
  }, [])

  function handleCoverSelect(file: File) {
    if (!file.type.startsWith('image/')) return
    const objectUrl = URL.createObjectURL(file)
    setCropSrc(objectUrl)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCropAspect(4 / 5)
  }

  async function handleCropConfirm() {
    if (!cropSrc || !croppedAreaPixels) return
    const blob = await getCroppedBlob(cropSrc, croppedAreaPixels)
    URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    const blobUrl = URL.createObjectURL(blob)
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
    setCoverPreviewUrl(blobUrl)
    uploadCover(new File([blob], 'cover.jpg', { type: 'image/jpeg' }), blobUrl)
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  async function uploadCover(file: File, previewBlobUrl: string) {
    setCoverState({ status: 'uploading' })
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
      const data = await res.json()
      URL.revokeObjectURL(previewBlobUrl)
      setCoverPreviewUrl(null)
      setCoverState({ status: 'done', url: data.secure_url })
    } catch {
      setCoverState({ status: 'error' })
    }
  }

  function toggleCategory(c: string) { setCategories(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]) }
  function toggleDiet(d: string) { setDiet(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]) }
  function toggleTime(k: string) { setCookTime(p => p === k ? '' : k) }

  const handleSubmit = async (publish: boolean) => {
    if (videoState.status !== 'done' || !title.trim()) return
    setSubmitting(true); setSubmitError(null)
    const result = await createRecipe({
      title, description,
      videoUrl: (videoState as { status: 'done'; videoUrl: string; duration: number | null }).videoUrl,
      thumbnailUrl: coverState.status === 'done' ? coverState.url : '',
      durationSeconds: (videoState as { status: 'done'; videoUrl: string; duration: number | null }).duration,
      tags: categories.map(c => c.toLowerCase()),
      diet: diet.map(d => d.toLowerCase()),
      cookTime: cookTime || null,
      publish,
    })
    if (result?.error) { setSubmitError(result.error); setSubmitting(false) }
  }

  const canGoNext = videoState.status === 'done'
  const canSubmit = videoState.status === 'done' && !!title.trim() && !!description.trim()
    && categories.length > 0 && !!cookTime && !submitting

  const coverSrc = coverState.status === 'done' ? coverState.url : coverPreviewUrl

  const isUploading = videoState.status === 'uploading'
  const isDone = videoState.status === 'done'
  const hasVideo = isUploading || isDone

  // Ghost gallery cells — slightly varied grays to look like real library
  const GHOST_SHADES = [87, 90, 85, 91, 88, 86, 92, 89, 84, 90, 87]

  return (
    <>
      {/* ── STEP 1: Instagram-style gallery picker ────────────────────────────── */}
      {step === 1 && (
        <div style={{ height: '100dvh', background: '#000', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4"
            style={{
              paddingTop: 'max(52px, calc(env(safe-area-inset-top) + 14px))',
              paddingBottom: 12,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
            <p className="text-[15px] font-bold text-white">Nueva publicación</p>
            <button
              onClick={() => setStep(2)}
              disabled={!canGoNext}
              className="flex items-center gap-1 text-[15px] font-bold transition-opacity"
              style={{ color: canGoNext ? '#f59e0b' : 'rgba(245,158,11,0.28)' }}
            >
              Siguiente
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* ── Video preview pane (top ~50%) ── */}
          <div className="relative flex-shrink-0 overflow-hidden" style={{ height: '46dvh', background: '#000' }}>
            {/* Video plays as soon as blob is ready */}
            {videoBlobUrlRef.current && (
              <video
                src={videoBlobUrlRef.current}
                className="w-full h-full object-contain"
                playsInline muted autoPlay loop
              />
            )}

            {/* Idle placeholder */}
            {videoState.status === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                    <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                </div>
                <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.28)' }}>Selecciona un vídeo abajo</p>
              </div>
            )}

            {/* Upload progress ring */}
            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{ background: 'rgba(0,0,0,0.52)' }}>
                <div className="relative flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-28 h-28" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f59e0b" strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - (videoState as { status: 'uploading'; progress: number }).progress / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.25s ease' }}
                    />
                  </svg>
                  <span className="absolute font-bold text-white"
                    style={{ fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>
                    {(videoState as { status: 'uploading'; progress: number }).progress}%
                  </span>
                </div>
                <p className="text-[12px] font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Subiendo vídeo...
                </p>
                <button onClick={resetVideo}
                  className="text-[11px] px-4 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.14)' }}>
                  Cancelar
                </button>
              </div>
            )}

            {/* Done badge */}
            {isDone && (
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(74,222,128,0.22)', border: '1.5px solid rgba(74,222,128,0.5)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            )}

            {/* Error */}
            {videoState.status === 'error' && (
              <div className="absolute bottom-3 left-3 right-3 rounded-xl py-2 px-3 text-center text-[12px]"
                style={{ background: 'rgba(220,38,38,0.2)', color: '#f87171' }}>
                {videoState.message}
              </div>
            )}
          </div>

          {/* ── Gallery pane (bottom) ── */}
          <div className="flex-1 flex flex-col min-h-0" style={{ background: '#fff' }}>

            {/* Gallery header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1">
                <span className="text-[14px] font-bold" style={{ color: '#111' }}>Recientes</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: '#f3f3f3', color: '#333' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Importar
              </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>

              {/* Cell 0 — selectable, shows selected video */}
              <div
                className="relative cursor-pointer"
                style={{ aspectRatio: '1', background: '#e0e0e0' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {videoBlobUrlRef.current ? (
                  <video
                    src={videoBlobUrlRef.current}
                    className="w-full h-full object-cover"
                    muted playsInline
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.08)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </div>
                  </div>
                )}
                {/* Selection ring + badge */}
                {hasVideo && (
                  <>
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ border: '3px solid #f59e0b' }} />
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                      style={{ background: '#f59e0b', color: '#000' }}>1</div>
                  </>
                )}
              </div>

              {/* Ghost cells — simulated library */}
              {GHOST_SHADES.map((shade, i) => (
                <div key={i} style={{ aspectRatio: '1', background: `hsl(0 0% ${shade}%)` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Detalles ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--cream)' }}>

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4"
            style={{
              paddingTop: 'max(52px, calc(env(safe-area-inset-top) + 14px))',
              paddingBottom: 14,
              background: 'var(--cream)',
              borderBottom: '1px solid var(--brown-100)',
            }}>
            <button onClick={() => setStep(1)}
              className="flex items-center gap-1 text-[14px] font-medium"
              style={{ color: 'var(--brown-500)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Atrás
            </button>
            <h1 className="text-[15px] font-bold" style={{ color: 'var(--brown-900)' }}>Nueva publicación</h1>
            <button onClick={() => handleSubmit(true)} disabled={!canSubmit}
              className="text-[15px] font-bold transition-opacity"
              style={{ color: canSubmit ? '#f59e0b' : 'rgba(245,158,11,0.3)' }}>
              {submitting ? 'Publicando...' : 'Publicar'}
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">

            {/* Cover — full-width, 4:5 ratio, no black bars */}
            <div className="relative w-full overflow-hidden"
              style={{ aspectRatio: '4/5', maxHeight: '55dvh', background: '#111', borderBottom: '1px solid var(--brown-100)' }}>
              {coverSrc
                ? <img src={coverSrc} alt="" className="w-full h-full object-cover" />
                : coverState.status === 'uploading'
                  ? <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 border-[3px] rounded-full animate-spin"
                        style={{ borderColor: 'rgba(255,255,255,0.15)', borderTopColor: '#f59e0b' }} />
                    </div>
                  : <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <span className="text-4xl opacity-20">🎬</span>
                      <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Sin portada</p>
                    </div>
              }
              {/* Editar portada overlay */}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                } as React.CSSProperties}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span className="text-[12px] font-semibold text-white">Editar portada</span>
              </button>
            </div>

            {/* Title */}
            <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--brown-100)' }}>
              <textarea
                value={title} onChange={e => setTitle(e.target.value)}
                maxLength={80} placeholder="Escribe un título..." rows={3}
                className="w-full text-[16px] font-medium resize-none focus:outline-none bg-transparent leading-relaxed"
                style={{ color: 'var(--brown-900)', caretColor: '#f59e0b' }}
              />
              <p className="text-right text-[11px] mt-1" style={{ color: 'var(--brown-300)' }}>{title.length}/80</p>
            </div>

            {/* Description */}
            <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--brown-100)' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--brown-400)' }}>
                Ingredientes y paso a paso <span style={{ color: '#dc2626' }}>*</span>
              </p>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={6} placeholder="Lista de ingredientes, pasos de la receta, trucos..."
                className="w-full text-[14px] rounded-2xl px-4 py-3 resize-none focus:outline-none"
                style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-900)', caretColor: '#f59e0b' }}
              />
            </div>

            {/* Categoría */}
            <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--brown-100)' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>
                Categoría <span style={{ color: '#dc2626' }}>*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <Chip key={c} label={c} emoji={CAT_EMOJIS[c.toLowerCase()] ?? '🍴'}
                    active={categories.includes(c)} onClick={() => toggleCategory(c)} />
                ))}
              </div>
            </div>

            {/* Tiempo */}
            <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--brown-100)' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>
                Tiempo de cocción <span style={{ color: '#dc2626' }}>*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {TIMES.map(t => (
                  <Chip key={t.key} label={t.label} emoji={t.emoji}
                    active={cookTime === t.key} onClick={() => toggleTime(t.key)} />
                ))}
              </div>
            </div>

            {/* Dieta */}
            <div className="px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brown-400)' }}>
                Dieta e intolerancias
                <span className="ml-1.5 font-normal normal-case text-[11px]" style={{ color: 'var(--brown-300)' }}>opcional</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {DIETS.map(d => (
                  <Chip key={d.key} label={d.label} emoji={d.emoji}
                    active={diet.includes(d.key)} onClick={() => toggleDiet(d.key)} />
                ))}
              </div>
            </div>

            {submitError && (
              <div className="px-4 pb-2">
                <p className="text-[13px] px-4 py-2.5 rounded-2xl text-center"
                  style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
                  {submitError}
                </p>
              </div>
            )}

            {/* Bottom buttons */}
            <div className="px-4 py-4 flex gap-2.5"
              style={{ paddingBottom: 'max(110px, calc(env(safe-area-inset-bottom) + 96px))' }}>
              <button onClick={() => handleSubmit(false)} disabled={!canSubmit}
                className="flex-1 font-semibold rounded-2xl py-3.5 text-[14px]"
                style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)', opacity: !canSubmit ? 0.38 : 1 }}>
                Borrador
              </button>
              <button onClick={() => handleSubmit(true)} disabled={!canSubmit}
                className="flex-[2] font-bold rounded-2xl py-3.5 text-[14px]"
                style={{ background: 'var(--amber)', color: '#000', opacity: !canSubmit ? 0.38 : 1 }}>
                {submitting ? 'Publicando...' : 'Publicar ahora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shared file inputs (always in DOM, ref always valid) ─────────────── */}
      <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoSelect(f); e.target.value = '' }} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverSelect(f); e.target.value = '' }} />

      {/* ── Crop modal (full-screen overlay, above everything) ────────────────── */}
      {cropSrc && (
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#000' }}>
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4"
            style={{
              paddingTop: 'max(52px, calc(env(safe-area-inset-top) + 12px))',
              paddingBottom: 12,
              background: 'rgba(0,0,0,0.7)',
            }}>
            <button onClick={handleCropCancel}
              className="text-[15px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Cancelar
            </button>
            <p className="text-[15px] font-bold text-white">Editar portada</p>
            <button onClick={handleCropConfirm}
              className="text-[15px] font-bold" style={{ color: '#f59e0b' }}>
              Listo
            </button>
          </div>

          {/* Crop area */}
          <div className="relative flex-1">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={cropAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={false}
              style={{
                containerStyle: { background: '#000' },
                cropAreaStyle: { border: '2px solid rgba(245,158,11,0.8)', borderRadius: 8 },
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 px-5 pt-3 flex flex-col gap-3"
            style={{
              background: 'rgba(0,0,0,0.7)',
              paddingBottom: 'max(28px, calc(env(safe-area-inset-bottom) + 12px))',
            }}>
            {/* Ratio chips */}
            <div className="flex justify-center gap-2">
              {([
                { label: '4:5', value: 4 / 5 },
                { label: '1:1', value: 1 },
                { label: '16:9', value: 16 / 9 },
                { label: 'Libre', value: undefined },
              ] as const).map(r => (
                <button key={r.label} type="button"
                  onClick={() => setCropAspect(r.value as number | undefined)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                  style={{
                    background: cropAspect === r.value ? '#f59e0b' : 'rgba(255,255,255,0.12)',
                    color: cropAspect === r.value ? '#000' : 'rgba(255,255,255,0.7)',
                    border: `1px solid ${cropAspect === r.value ? '#f59e0b' : 'rgba(255,255,255,0.18)'}`,
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
            {/* Zoom slider */}
            <input type="range" min={1} max={3} step={0.01} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: '#f59e0b' }}
            />
          </div>
        </div>
      )}
    </>
  )
}
