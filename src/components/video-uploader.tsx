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

const NUM_FRAMES = 14

function FramePicker({ blobUrl, duration, onSelect }: {
  blobUrl: string
  duration: number
  onSelect: (idx: number) => void
}) {
  const [frames, setFrames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIdx, setSelectedIdx] = useState(0)

  useEffect(() => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.src = blobUrl
    const captured: string[] = []
    let idx = 0

    const capture = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 54
      canvas.height = 72
      canvas.getContext('2d')!.drawImage(video, 0, 0, 54, 72)
      captured.push(canvas.toDataURL('image/jpeg', 0.75))
      idx++
      if (idx < NUM_FRAMES) {
        video.currentTime = (idx / (NUM_FRAMES - 1)) * duration
      } else {
        setFrames([...captured])
        setLoading(false)
        video.src = ''
      }
    }

    video.onseeked = capture
    video.onloadedmetadata = () => { video.currentTime = 0 }
    video.onerror = () => setLoading(false)
    return () => { video.src = '' }
  }, [blobUrl, duration])

  function handleSelect(i: number) {
    setSelectedIdx(i)
    onSelect(i)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 px-1">
        <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.15)', borderTopColor: '#f59e0b' }} />
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando frames...</span>
      </div>
    )
  }

  return (
    <div className="flex gap-0.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
      {frames.map((dataUrl, i) => (
        <button key={i} type="button" onClick={() => handleSelect(i)}
          className="flex-shrink-0 rounded overflow-hidden relative"
          style={{
            width: 44, height: 58,
            outline: i === selectedIdx ? '2.5px solid #f59e0b' : '2.5px solid transparent',
            outlineOffset: '-2.5px',
          }}>
          <img src={dataUrl} alt="" className="w-full h-full object-cover" draggable={false} />
          {i === selectedIdx && (
            <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: '#f59e0b' }} />
          )}
        </button>
      ))}
    </div>
  )
}

function Chip({ label, emoji, active, onClick }: { label: string; emoji: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
      style={{
        background: active ? 'var(--amber)' : '#fff',
        color: active ? '#000' : 'var(--brown-700)',
        border: `1.5px solid ${active ? 'var(--amber)' : 'var(--brown-100)'}`,
      }}>
      <span className="text-base leading-none flex-shrink-0">{emoji}</span>
      <span className="leading-tight">{label}</span>
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

  // Auto-generate cover thumbnail once video is uploaded
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
    // Upload immediately
    uploadCover(file)
  }

  async function uploadCover(file: File) {
    setCoverState(prev => prev.status === 'selected' ? { ...prev } : prev)
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

  // ── Step 1: Video + cover ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-dvh pb-28 flex flex-col" style={{ background: '#000' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-14 pb-3"
          style={{ background: '#000', borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
          <h1 className="text-base font-semibold text-white">Nueva publicación</h1>
          <button
            onClick={() => setStep(2)}
            disabled={!canGoNext}
            className="text-sm font-bold transition-opacity"
            style={{ color: canGoNext ? '#f59e0b' : 'rgba(245,158,11,0.3)' }}>
            Siguiente
          </button>
        </div>

        {/* Video preview — full width, 9:16 */}
        <div className="flex-1 flex items-center justify-center bg-black" style={{ minHeight: '55vh' }}>
          {videoState.status === 'idle' || videoState.status === 'error' ? (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
                  <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </div>
              <p className="text-white font-semibold">Seleccionar vídeo</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Máx. 100 MB · formato 9:16</p>
              {videoState.status === 'error' && (
                <p className="text-xs px-6 text-center" style={{ color: '#f87171' }}>{videoState.message}</p>
              )}
            </button>
          ) : videoState.status === 'preview' ? (
            <div className="w-full" style={{ aspectRatio: '9/16', maxHeight: '60vh' }}>
              <video src={videoState.blobUrl} className="w-full h-full object-contain"
                controls playsInline muted />
            </div>
          ) : videoState.status === 'uploading' ? (
            <div className="flex flex-col items-center gap-4 px-10 w-full">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </div>
              <div className="w-full">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-white font-medium">Subiendo vídeo...</span>
                  <span style={{ color: '#f59e0b' }} className="font-bold">{videoState.progress}%</span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${videoState.progress}%`, background: '#f59e0b' }} />
                </div>
              </div>
            </div>
          ) : videoState.status === 'done' ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.15)' }}>
                <svg viewBox="0 0 24 24" fill="#4ade80" className="w-8 h-8">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14l-4-4 1.414-1.414L11 13.172l4.586-4.586L17 10l-6 6z" />
                </svg>
              </div>
              <p className="text-white font-semibold">Vídeo listo</p>
              <button onClick={() => { setVideoState({ status: 'idle' }); setCoverState({ status: 'idle' }) }}
                className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Cambiar vídeo
              </button>
            </div>
          ) : null}
        </div>

        {/* Bottom panel: cover + actions */}
        <div style={{ background: '#111', borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>

          {/* Cover / Frame picker */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Portada</p>
              <button type="button" onClick={() => coverInputRef.current?.click()}
                className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
                Subir foto
              </button>
            </div>

            <div className="flex gap-3 items-start">
              {/* Selected cover preview */}
              <div className="relative flex-shrink-0 rounded-xl overflow-hidden"
                style={{ width: 60, height: 80, background: '#222', border: `2px solid ${coverSrc ? '#f59e0b' : 'rgba(255,255,255,0.15)'}` }}>
                {coverSrc ? (
                  <img src={coverSrc} alt="" className="w-full h-full object-contain" style={{ background: '#000' }} />
                ) : coverState.status === 'uploading' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#f59e0b' }} />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                )}
                {coverSrc && (
                  <div className="absolute bottom-0.5 left-0 right-0 flex justify-center">
                    <span className="text-[8px] font-bold text-white px-1 py-0.5 rounded-full" style={{ background: '#f59e0b' }}>PORTADA</span>
                  </div>
                )}
              </div>

              {/* Frame strip — only when video is done and blob available */}
              <div className="flex-1 min-w-0">
                {videoState.status === 'done' && videoBlobUrlRef.current ? (
                  <>
                    <p className="text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Selecciona el frame de portada
                    </p>
                    <FramePicker
                      blobUrl={videoBlobUrlRef.current}
                      duration={videoState.duration ?? 30}
                      onSelect={handleFrameSelect}
                    />
                  </>
                ) : (
                  <p className="text-xs pt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Sube el vídeo para seleccionar el frame de portada
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Upload / change video button */}
          <div className="px-4 pb-4">
            {videoState.status === 'preview' && (
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => { URL.revokeObjectURL(videoState.blobUrl); setVideoState({ status: 'idle' }) }}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                  Otro vídeo
                </button>
                <button type="button" onClick={() => uploadVideo(videoState.file)}
                  className="flex-[2] py-3 rounded-xl text-sm font-semibold"
                  style={{ background: '#f59e0b', color: '#000' }}>
                  Subir vídeo
                </button>
              </div>
            )}
            {(videoState.status === 'idle' || videoState.status === 'error') && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#f59e0b', color: '#000' }}>
                Seleccionar vídeo
              </button>
            )}
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoSelect(f); e.target.value = '' }} />
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverSelect(f); e.target.value = '' }} />
      </div>
    )
  }

  // ── Step 2: Detalles ───────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh pb-28 flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-3 flex-shrink-0"
        style={{ background: 'var(--cream)', borderBottom: '1px solid var(--brown-100)' }}>
        <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm" style={{ color: 'var(--brown-500)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Atrás
        </button>
        <h1 className="text-base font-semibold" style={{ color: 'var(--brown-900)' }}>Detalles</h1>
        <button onClick={() => handleSubmit(true)} disabled={!canSubmit}
          className="text-sm font-bold transition-opacity"
          style={{ color: canSubmit ? '#f59e0b' : 'rgba(245,158,11,0.3)' }}>
          {submitting ? 'Publicando...' : 'Publicar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Video + cover preview strip */}
        <div className="flex gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--brown-100)' }}>
          {/* Miniatura portada */}
          <div className="flex-shrink-0 rounded-xl overflow-hidden"
            style={{ width: 64, height: 85, background: '#111', border: '1.5px solid var(--brown-100)' }}>
            {coverSrc ? (
              <img src={coverSrc} alt="" className="w-full h-full object-contain" style={{ background: '#000' }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg">🎬</div>
            )}
          </div>
          {/* Title input inline */}
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Escribe un título..."
              rows={3}
              className="flex-1 text-sm font-medium resize-none focus:outline-none bg-transparent leading-relaxed"
              style={{ color: 'var(--brown-900)' }}
            />
            <p className="text-xs" style={{ color: 'var(--brown-300)' }}>{title.length}/80</p>
          </div>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--brown-400)' }}>
              Ingredientes y paso a paso <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={6} placeholder="Lista de ingredientes, pasos de la receta, trucos..."
              className="w-full text-sm rounded-2xl px-4 py-3 resize-none focus:outline-none"
              style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-900)' }} />
          </div>

          {/* Categorías */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>
              Categoría <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <Chip key={c} label={c} emoji={CAT_EMOJIS[c.toLowerCase()] ?? '🍴'}
                  active={categories.includes(c)} onClick={() => toggleCategory(c)} />
              ))}
            </div>
          </div>

          {/* Tiempo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>
              Tiempo de cocción <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TIMES.map(t => (
                <Chip key={t.key} label={t.label} emoji={t.emoji}
                  active={cookTime === t.key} onClick={() => toggleTime(t.key)} />
              ))}
            </div>
          </div>

          {/* Dieta */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--brown-400)' }}>
              Dieta e intolerancias <span className="font-normal normal-case" style={{ color: 'var(--brown-300)' }}>(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETS.map(d => (
                <Chip key={d.key} label={d.label} emoji={d.emoji}
                  active={diet.includes(d.key)} onClick={() => toggleDiet(d.key)} />
              ))}
            </div>
          </div>

          {submitError && <p className="text-sm" style={{ color: '#dc2626' }}>{submitError}</p>}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={() => handleSubmit(false)} disabled={!canSubmit}
              className="flex-1 font-medium rounded-2xl py-3.5 text-sm"
              style={{ background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)', opacity: !canSubmit ? 0.4 : 1 }}>
              Guardar borrador
            </button>
            <button onClick={() => handleSubmit(true)} disabled={!canSubmit}
              className="flex-1 font-semibold rounded-2xl py-3.5 text-sm"
              style={{ background: 'var(--amber)', color: '#000', opacity: !canSubmit ? 0.4 : 1 }}>
              {submitting ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
