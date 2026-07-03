'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchComments, addComment, deleteComment } from '@/app/(main)/receta/[id]/comment-actions'
import type { CommentWithUser } from '@/lib/types'

function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (s < 60) return 'ahora'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

interface Props {
  recipeId: string | null
  userId: string | null
  onClose: () => void
  onCountChange: (recipeId: string, delta: number) => void
}

export default function CommentSheet({ recipeId, userId, onClose, onCountChange }: Props) {
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const visible = !!recipeId

  useEffect(() => {
    if (!recipeId) { setComments([]); return }
    setLoading(true)
    fetchComments(recipeId).then(data => {
      setComments(data)
      setLoading(false)
      setTimeout(() => listRef.current?.scrollTo({ top: 99999 }), 50)
    })
  }, [recipeId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || submitting || !recipeId || !userId) return
    setSubmitting(true)
    setSubmitError(null)
    const result = await addComment(recipeId, text.trim())
    if (result.comment) {
      setComments(prev => [...prev, result.comment!])
      setText('')
      if (recipeId) onCountChange(recipeId, +1)
      setTimeout(() => listRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 50)
    } else if (result.error) {
      setSubmitError(result.error)
    }
    setSubmitting(false)
  }

  async function handleDelete(commentId: string) {
    await deleteComment(commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
    if (recipeId) onCountChange(recipeId, -1)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.5)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[70] flex flex-col transition-transform duration-300 ease-out"
        style={{
          height: '70dvh',
          borderRadius: '20px 20px 0 0',
          background: 'var(--cream)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--brown-300)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--brown-100)' }}>
          <h3 className="font-black text-base" style={{ color: 'var(--brown-900)' }}>
            {loading ? 'Comentarios' : `${comments.length} comentario${comments.length !== 1 ? 's' : ''}`}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--brown-100)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4" style={{ color: 'var(--brown-500)' }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
          style={{ overscrollBehavior: 'contain' }}>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--brown-100)', borderTopColor: 'var(--amber)' }} />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-3xl mb-2">💬</span>
              <p className="text-sm font-semibold" style={{ color: 'var(--brown-700)' }}>Sin comentarios aún</p>
              <p className="text-xs mt-1" style={{ color: 'var(--brown-300)' }}>Sé el primero en comentar</p>
            </div>
          ) : comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-black flex-shrink-0 overflow-hidden"
                style={{ background: 'var(--amber)' }}>
                {c.users.avatar_url
                  ? <img src={c.users.avatar_url} alt="" className="w-full h-full object-cover" />
                  : c.users.display_name[0].toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-bold" style={{ color: 'var(--brown-700)' }}>
                    {c.users.display_name}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--brown-300)' }}>
                    {timeAgo(c.created_at)}
                  </span>
                </div>
                <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--brown-900)' }}>
                  {c.content}
                </p>
              </div>
              {userId && c.user_id === userId && (
                <button onClick={() => handleDelete(c.id)} className="flex-shrink-0 self-start mt-1"
                  style={{ color: 'var(--brown-300)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-5 py-3" style={{ borderTop: '1px solid var(--brown-100)' }}>
          {submitError && (
            <p className="text-xs mb-2 text-center" style={{ color: '#dc2626' }}>{submitError}</p>
          )}
          {userId ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={300}
                placeholder="Añade un comentario..."
                className="input-cream flex-1"
                style={{ fontSize: 15 }}
              />
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="px-4 py-2.5 rounded-2xl font-semibold text-sm flex-shrink-0 transition-opacity"
                style={{
                  background: 'var(--amber)',
                  color: '#000',
                  opacity: !text.trim() || submitting ? 0.4 : 1,
                }}
              >
                {submitting ? '...' : 'Enviar'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-center py-2" style={{ color: 'var(--brown-500)' }}>
              <a href="/login" style={{ color: 'var(--brown-900)', fontWeight: 700 }}>Inicia sesión</a>
              {' '}para comentar
            </p>
          )}
        </div>
      </div>
    </>
  )
}
