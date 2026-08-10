'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { getUploadSignature, getImageUploadSignature, createRecipe } from '@/app/(main)/subir/actions'
import { CATEGORIES, CAT_EMOJIS, DIETS, TIMES } from '@/lib/categories'

// No 'preview' state — upload starts automatically on file select
type VideoState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'done'; videoUrl: string; duration: number | null }
  | { status: 'error'; message: string }

type CoverState =
  | { status: 'idle' }
  | { status: 'selected'; blobUrl: string }
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

  useEffect(() => {
    if (videoState.status === 'done' && coverState.status === 'idle') {
      const autoThumb = videoState.videoUrl.replace('/upload/', '/upload/so_auto,w_1080,h_1920,c_fill,f_jpg/')
      setCoverState({ status: 'done', url: autoThumb })
    }
  }, [videoState.status])

  useEffect(() => {
    return () => {
      if (coverState.status === 'selected') URL.revokeObjectURL(coverState.blobUrl)
    }
  }, [])

  function resetVideo() {
    xhrRef.current?.abort()
    xhrRef.current = null
    if (videoBlobUrlRef.current) { URL.revokeObjectURL(videoBlobUrlRef.current); videoBlobUrlRef.current = null }
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
    // Start upload immediately — no manual confirmation step
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
    if (coverState.status === 'selected') URL.revokeObjectURL(coverState.blobUrl)
    setCoverState({ status: 'selected', blobUrl: URL.createObjectURL(file) })
    uploadCover(file)
  }

  async function uploadCover(file: File) {
    const blobUrl = URL.createObjectURL(file)
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
      URL.revokeObjectURL(blobUrl)
      setCoverState({ status: 'done', url: data.secure_url })
    } catch {
      URL.revokeObjectURL(blobUrl)
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

  const canGoNext = videoState.status === 'done'
  const canSubmit = videoState.status === 'done' && !!title.trim() && !!description.trim()
    && categories.length > 0 && !!cookTime && !submitting

  const coverSrc = coverState.status === 'done' ? coverState.url
    : coverState.status === 'selected' ? coverState.blobUrl
    : null

  // ── Step 1: Seleccionar + subir vídeo ─────────────────────────────────────
  if (step === 1) {
    const isIdle = videoState.status === 'idle' || videoState.status === 'error'
    const isUploading = videoState.status === 'uploading'
    const isDone = videoState.status === 'done'

    return (
      <div className="relative overflow-hidden" style={{ height: '100dvh', background: '#000' }}>

        {/* ── Background layer ──
            Uploading: local video blob plays in background (like Instagram)
            Done: selected cover image fills the screen                        */}
        {(isUploading || isDone) && videoBlobUrlRef.current && !coverSrc && (
          <video
            src={videoBlobUrlRef.current}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ background: '#000' }}
            playsInline muted autoPlay loop
          />
        )}
        {isDone && coverSrc && (
          <img
            src={coverSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            style={{ background: '#000' }}
          />
        )}

        {/* ── Idle / error: centered CTA ── */}
        {isIdle && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-5"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.18)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
                <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-base">Seleccionar vídeo</p>
              <p className="text-[13px] mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>MP4 · MOV · Máx. 100 MB</p>
              <p className="text-[11px] mt-2 px-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.22)' }}>
                En iPhone elige &quot;Biblioteca de fotos&quot;
              </p>
            </div>
            {videoState.status === 'error' && (
              <p className="text-[13px] px-8 py-2.5 rounded-2xl text-center mx-6"
                style={{ background: 'rgba(220,38,38,0.18)', color: '#f87171' }}>
                {videoState.message}
              </p>
            )}
          </button>
        )}

        {/* ── Uploading: dark overlay + circular progress (video plays behind) ── */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: 'rgba(0,0,0,0.55)' }}>
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-36 h-36" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f59e0b" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - videoState.progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.25s ease' }}
                />
              </svg>
              <span className="absolute font-bold text-white" style={{ fontSize: 26, fontVariantNumeric: 'tabular-nums' }}>
                {videoState.progress}%
              </span>
            </div>
            <p className="text-[13px] font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Subiendo vídeo...
            </p>
            <button
              onClick={resetVideo}
              className="text-[12px] px-4 py-1.5 rounded-full mt-1"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* ── Done: check + "Cambiar vídeo" (centre, behind the cover) ── */}
        {isDone && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
            style={{ background: coverSrc ? 'rgba(0,0,0,0.4)' : 'transparent' }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(74,222,128,0.18)', border: '2px solid rgba(74,222,128,0.45)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="text-white font-semibold text-[15px]">Vídeo listo</p>
            <button
              onClick={resetVideo}
              className="pointer-events-auto text-[13px] px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              Cambiar vídeo
            </button>
          </div>
        )}

        {/* ── Top gradient ── */}
        <div className="absolute top-0 left-0 right-0 pointer-events-none z-10"
          style={{ height: 130, background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, transparent 100%)' }} />

        {/* ── Header ── */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5"
          style={{ paddingTop: 'max(52px, calc(env(safe-area-inset-top) + 16px))' }}>
          <p className="text-[15px] font-semibold text-white tracking-tight">Nueva publicación</p>
          <button
            onClick={() => setStep(2)}
            disabled={!canGoNext}
            className="text-[15px] font-bold transition-opacity"
            style={{ color: canGoNext ? '#f59e0b' : 'rgba(245,158,11,0.28)' }}
          >
            Siguiente
          </button>
        </div>

        {/* ── Bottom gradient (only when cover panel visible) ── */}
        {isDone && (
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
            style={{ height: 300, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)' }} />
        )}

        {/* ── Editar portada (only when done) ── */}
        {isDone && (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-4"
            style={{ paddingBottom: 'max(110px, calc(env(safe-area-inset-bottom) + 96px))' }}>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              } as React.CSSProperties}
            >
              {/* Cover mini preview */}
              <div className="relative flex-shrink-0 rounded-lg overflow-hidden"
                style={{ width: 36, height: 48, background: '#1a1a1a' }}>
                {coverSrc
                  ? <img src={coverSrc} alt="" className="w-full h-full object-cover" />
                  : coverState.status === 'uploading'
                    ? <div className="w-full h-full flex items-center justify-center">
                        <div className="w-3 h-3 border-2 rounded-full animate-spin"
                          style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#f59e0b' }} />
                      </div>
                    : <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>🎬</div>
                }
              </div>
              {/* Label */}
              <div className="flex-1 text-left">
                <p className="text-[13px] font-semibold text-white leading-tight">Portada del vídeo</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {coverSrc ? 'Toca para cambiar' : 'Selecciona una imagen'}
                </p>
              </div>
              {/* Camera icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.25)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* ── Idle: select button at bottom ── */}
        {isIdle && (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-4"
            style={{ paddingBottom: 'max(110px, calc(env(safe-area-inset-bottom) + 96px))' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 rounded-2xl text-[14px] font-bold"
              style={{ background: '#f59e0b', color: '#000' }}
            >
              Seleccionar vídeo
            </button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoSelect(f); e.target.value = '' }} />
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverSelect(f); e.target.value = '' }} />
      </div>
    )
  }

  // ── Step 2: Detalles ───────────────────────────────────────────────────────
  return (
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

        {/* Cover + title */}
        <div className="flex gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--brown-100)' }}>
          <div className="flex-shrink-0 rounded-xl overflow-hidden"
            style={{ width: 68, height: 90, background: '#111', border: '1.5px solid var(--brown-100)' }}>
            {coverSrc
              ? <img src={coverSrc} alt="" className="w-full h-full object-contain" style={{ background: '#000' }} />
              : <div className="w-full h-full flex items-center justify-center text-xl opacity-30">🎬</div>
            }
          </div>
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <textarea
              value={title} onChange={e => setTitle(e.target.value)}
              maxLength={80} placeholder="Escribe un título..." rows={3}
              className="flex-1 text-[15px] font-medium resize-none focus:outline-none bg-transparent leading-relaxed"
              style={{ color: 'var(--brown-900)', caretColor: '#f59e0b' }}
            />
            <p className="text-[11px]" style={{ color: 'var(--brown-300)' }}>{title.length}/80</p>
          </div>
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
          style={{ paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 16px))' }}>
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
  )
}
