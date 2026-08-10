'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { getUploadSignature, getImageUploadSignature, createRecipe } from '@/app/(main)/subir/actions'
import { CATEGORIES, CAT_EMOJIS, DIETS, TIMES } from '@/lib/categories'

type VideoState =
  | { status: 'idle' }
  | { status: 'preview'; file: File; blobUrl: string }
  | { status: 'uploading'; progress: number }
  | { status: 'done'; videoUrl: string; duration: number | null }
  | { status: 'error'; message: string }

type CoverState =
  | { status: 'idle' }
  | { status: 'selected'; blobUrl: string }
  | { status: 'uploading' }
  | { status: 'done'; url: string }
  | { status: 'error' }

const NUM_FRAMES = 8

function FramePicker({ blobUrl, duration, onSelect }: {
  blobUrl: string
  duration: number
  onSelect: (idx: number) => void
}) {
  const [frames, setFrames] = useState<(string | null)[]>(() => new Array(NUM_FRAMES).fill(null))
  const [selectedIdx, setSelectedIdx] = useState(0)

  useEffect(() => {
    setFrames(new Array(NUM_FRAMES).fill(null))
    let cancelled = false
    const videos: HTMLVideoElement[] = []

    for (let i = 0; i < NUM_FRAMES; i++) {
      const idx = i
      const time = (idx / (NUM_FRAMES - 1)) * duration
      const v = document.createElement('video')
      v.muted = true
      v.playsInline = true
      v.preload = 'auto'
      v.src = blobUrl
      videos.push(v)

      const capture = () => {
        if (cancelled) return
        const canvas = document.createElement('canvas')
        canvas.width = 54; canvas.height = 72
        canvas.getContext('2d')!.drawImage(v, 0, 0, 54, 72)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
        setFrames(prev => { const n = [...prev]; n[idx] = dataUrl; return n })
        v.src = ''
      }

      v.onseeked = capture
      v.onloadedmetadata = () => { v.currentTime = time }
      v.onerror = () => { if (!cancelled) setFrames(prev => { const n = [...prev]; n[idx] = ''; return n }) }
    }

    return () => { cancelled = true; videos.forEach(v => { v.src = '' }) }
  }, [blobUrl, duration])

  function handleSelect(i: number) {
    setSelectedIdx(i)
    onSelect(i)
  }

  return (
    <div className="flex gap-0.5 overflow-x-auto" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
      {frames.map((dataUrl, i) => (
        <button key={i} type="button" onClick={() => dataUrl && handleSelect(i)}
          className="flex-shrink-0 rounded-lg overflow-hidden relative transition-all"
          style={{
            width: 40, height: 54,
            outline: i === selectedIdx ? '2px solid #f59e0b' : '2px solid transparent',
            outlineOffset: '-2px',
            background: '#1a1a1a',
            transform: i === selectedIdx ? 'scale(1.06)' : 'scale(1)',
          }}>
          {dataUrl
            ? <img src={dataUrl} alt="" className="w-full h-full object-cover" draggable={false} />
            : <div className="w-full h-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 border border-white/15 border-t-amber-400 rounded-full animate-spin" />
              </div>
          }
        </button>
      ))}
    </div>
  )
}

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
      if (videoState.status === 'preview') URL.revokeObjectURL(videoState.blobUrl)
      if (coverState.status === 'selected') URL.revokeObjectURL(coverState.blobUrl)
    }
  }, [])

  function handleVideoSelect(file: File) {
    if (!file.type.startsWith('video/')) {
      setVideoState({ status: 'error', message: 'El archivo debe ser un vídeo.' }); return
    }
    if (file.size > 100 * 1024 * 1024) {
      setVideoState({ status: 'error', message: 'El vídeo pesa más de 100 MB.' }); return
    }
    if (videoBlobUrlRef.current) URL.revokeObjectURL(videoBlobUrlRef.current)
    const blobUrl = URL.createObjectURL(file)
    videoBlobUrlRef.current = blobUrl
    setVideoState({ status: 'preview', file, blobUrl })
  }

  function handleFrameSelect(frameIdx: number) {
    if (videoState.status !== 'done') return
    const duration = videoState.duration ?? 30
    const time = (frameIdx / (NUM_FRAMES - 1)) * duration
    const thumbUrl = videoState.videoUrl.replace('/upload/', `/upload/so_${time.toFixed(1)},w_1080,h_1920,c_fill,f_jpg/`)
    setCoverState({ status: 'done', url: thumbUrl })
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
    if (coverState.status === 'selected') URL.revokeObjectURL(coverState.blobUrl)
    setCoverState({ status: 'selected', blobUrl: URL.createObjectURL(file) })
    uploadCover(file)
  }

  async function uploadCover(file: File) {
    const blobUrl = URL.createObjectURL(file)
    setCoverState({ status: 'selected', blobUrl })
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

  // ── Step 1: Video + portada ────────────────────────────────────────────────
  if (step === 1) {
    const isIdle = videoState.status === 'idle' || videoState.status === 'error'
    const isPreview = videoState.status === 'preview'
    const isUploading = videoState.status === 'uploading'
    const isDone = videoState.status === 'done'
    const showCoverPanel = isDone

    return (
      <div className="relative overflow-hidden" style={{ height: '100dvh', background: '#000' }}>

        {/* ── Background: video (preview) or cover image (done) ── */}
        {isPreview && (
          <video
            src={videoState.blobUrl}
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

        {/* ── Idle: centered upload CTA ── */}
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
              <p className="text-white font-semibold text-base leading-tight">Seleccionar vídeo</p>
              <p className="text-[13px] mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                MP4 · MOV · Máx. 100 MB
              </p>
              <p className="text-[11px] mt-2 px-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.22)' }}>
                En iPhone elige &quot;Biblioteca de fotos&quot;
              </p>
            </div>
            {videoState.status === 'error' && (
              <div className="px-6">
                <p className="text-[13px] px-4 py-2.5 rounded-2xl text-center" style={{ background: 'rgba(220,38,38,0.18)', color: '#f87171' }}>
                  {videoState.message}
                </p>
              </div>
            )}
          </button>
        )}

        {/* ── Upload progress: full-screen circular ring ── */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-36 h-36" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke="#f59e0b" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - videoState.progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.25s ease' }}
                />
              </svg>
              <span
                className="absolute font-bold text-white"
                style={{ fontSize: 26, fontVariantNumeric: 'tabular-nums' }}
              >
                {videoState.progress}%
              </span>
            </div>
            <p className="text-[13px] font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Subiendo vídeo...
            </p>
          </div>
        )}

        {/* ── Done: check icon overlay on top of cover ── */}
        {isDone && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
            style={{ background: coverSrc ? 'rgba(0,0,0,0.42)' : 'transparent' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(74,222,128,0.18)', border: '2px solid rgba(74,222,128,0.45)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="text-white font-semibold">Vídeo listo</p>
            <button
              onClick={() => { setVideoState({ status: 'idle' }); setCoverState({ status: 'idle' }) }}
              className="pointer-events-auto text-[13px] px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              Cambiar vídeo
            </button>
          </div>
        )}

        {/* ── Top gradient ── */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none z-10"
          style={{ height: 140, background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)' }}
        />

        {/* ── Header (floats over video) ── */}
        <div
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5"
          style={{ paddingTop: 'max(52px, calc(env(safe-area-inset-top) + 16px))' }}
        >
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

        {/* ── Bottom gradient ── */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
          style={{
            height: showCoverPanel ? 340 : 230,
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)',
          }}
        />

        {/* ── Bottom panel (floats over video) ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 px-4 flex flex-col gap-3"
          style={{ paddingBottom: 'max(110px, calc(env(safe-area-inset-bottom) + 96px))' }}
        >
          {/* Cover + frame picker — only when done */}
          {showCoverPanel && (
            <div className="flex items-start gap-3 mb-1">
              <div
                className="relative flex-shrink-0 rounded-xl overflow-hidden"
                style={{
                  width: 52, height: 70,
                  background: '#1a1a1a',
                  border: `2px solid ${coverSrc ? '#f59e0b' : 'rgba(255,255,255,0.2)'}`,
                }}
              >
                {coverSrc ? (
                  <img src={coverSrc} alt="" className="w-full h-full object-contain" style={{ background: '#000' }} />
                ) : coverState.status === 'uploading' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-3 h-3 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'rgba(255,255,255,0.15)', borderTopColor: '#f59e0b' }} />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg opacity-30">🎬</div>
                )}
                {coverSrc && (
                  <div className="absolute bottom-0.5 left-0 right-0 flex justify-center">
                    <span className="text-[7px] font-black text-black px-1 py-0.5 rounded-full" style={{ background: '#f59e0b', letterSpacing: '0.05em' }}>PORTADA</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    FRAME
                  </p>
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="text-[12px] font-semibold"
                    style={{ color: '#f59e0b' }}
                  >
                    Subir foto
                  </button>
                </div>
                {videoBlobUrlRef.current ? (
                  <FramePicker
                    blobUrl={videoBlobUrlRef.current}
                    duration={videoState.status === 'done' ? (videoState.duration ?? 30) : 30}
                    onSelect={handleFrameSelect}
                  />
                ) : (
                  <div className="flex gap-0.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 rounded-lg"
                        style={{ width: 40, height: 54, background: 'rgba(255,255,255,0.07)' }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview: upload / change buttons */}
          {isPreview && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { URL.revokeObjectURL(videoState.blobUrl); setVideoState({ status: 'idle' }) }}
                className="flex-1 py-3.5 rounded-2xl text-[14px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Otro vídeo
              </button>
              <button
                type="button"
                onClick={() => uploadVideo(videoState.file)}
                className="flex-[2] py-3.5 rounded-2xl text-[14px] font-bold"
                style={{ background: '#f59e0b', color: '#000' }}
              >
                Subir vídeo
              </button>
            </div>
          )}

          {/* Idle: select button */}
          {isIdle && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 rounded-2xl text-[14px] font-bold tracking-wide"
              style={{ background: '#f59e0b', color: '#000' }}
            >
              Seleccionar vídeo
            </button>
          )}
        </div>

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
      <div
        className="flex-shrink-0 flex items-center justify-between px-4"
        style={{
          paddingTop: 'max(52px, calc(env(safe-area-inset-top) + 14px))',
          paddingBottom: 14,
          background: 'var(--cream)',
          borderBottom: '1px solid var(--brown-100)',
        }}
      >
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-1 text-[14px] font-medium"
          style={{ color: 'var(--brown-500)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Atrás
        </button>
        <h1 className="text-[15px] font-bold" style={{ color: 'var(--brown-900)' }}>
          Nueva publicación
        </h1>
        <button
          onClick={() => handleSubmit(true)}
          disabled={!canSubmit}
          className="text-[15px] font-bold transition-opacity"
          style={{ color: canSubmit ? '#f59e0b' : 'rgba(245,158,11,0.3)' }}
        >
          {submitting ? 'Publicando...' : 'Publicar'}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Cover + title (Instagram-style: thumbnail left, caption right) */}
        <div
          className="flex gap-3 px-4 py-4"
          style={{ borderBottom: '1px solid var(--brown-100)' }}
        >
          <div
            className="flex-shrink-0 rounded-xl overflow-hidden"
            style={{ width: 68, height: 90, background: '#111', border: '1.5px solid var(--brown-100)' }}
          >
            {coverSrc ? (
              <img src={coverSrc} alt="" className="w-full h-full object-contain" style={{ background: '#000' }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl opacity-30">🎬</div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Escribe un título..."
              rows={3}
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
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={6}
            placeholder="Lista de ingredientes, pasos de la receta, trucos..."
            className="w-full text-[14px] rounded-2xl px-4 py-3 resize-none focus:outline-none"
            style={{
              background: '#fff',
              border: '1.5px solid var(--brown-100)',
              color: 'var(--brown-900)',
              caretColor: '#f59e0b',
            }}
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

        {/* Error */}
        {submitError && (
          <div className="px-4 pb-2">
            <p className="text-[13px] px-4 py-2.5 rounded-2xl text-center"
              style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
              {submitError}
            </p>
          </div>
        )}

        {/* Bottom buttons */}
        <div
          className="px-4 py-4 flex gap-2.5"
          style={{ paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 16px))' }}
        >
          <button
            onClick={() => handleSubmit(false)}
            disabled={!canSubmit}
            className="flex-1 font-semibold rounded-2xl py-3.5 text-[14px]"
            style={{
              background: '#fff',
              border: '1.5px solid var(--brown-100)',
              color: 'var(--brown-700)',
              opacity: !canSubmit ? 0.38 : 1,
            }}
          >
            Borrador
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={!canSubmit}
            className="flex-[2] font-bold rounded-2xl py-3.5 text-[14px]"
            style={{
              background: 'var(--amber)',
              color: '#000',
              opacity: !canSubmit ? 0.38 : 1,
            }}
          >
            {submitting ? 'Publicando...' : 'Publicar ahora'}
          </button>
        </div>
      </div>
    </div>
  )
}
