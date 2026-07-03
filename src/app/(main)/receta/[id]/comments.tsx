'use client'

import { useState, useRef } from 'react'
import { addComment, deleteComment } from './comment-actions'
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

export default function Comments({
  recipeId,
  initialComments,
  currentUserId,
}: {
  recipeId: string
  initialComments: CommentWithUser[]
  currentUserId: string | null
}) {
  const [comments, setComments] = useState(initialComments)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || submitting || !currentUserId) return
    setSubmitting(true)
    const result = await addComment(recipeId, text.trim())
    if (result.comment) {
      setComments(prev => [...prev, result.comment!])
      setText('')
    }
    setSubmitting(false)
  }

  async function handleDelete(commentId: string) {
    await deleteComment(commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  return (
    <div>
      <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--brown-900)' }}>
        {comments.length > 0 ? `${comments.length} comentario${comments.length !== 1 ? 's' : ''}` : 'Comentarios'}
      </h3>

      {comments.length === 0 && (
        <p className="text-sm mb-4" style={{ color: 'var(--brown-300)' }}>
          Sé el primero en comentar
        </p>
      )}

      <div className="space-y-4 mb-5">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-black font-bold text-xs flex-shrink-0 overflow-hidden"
              style={{ background: 'var(--amber)' }}>
              {comment.users.avatar_url ? (
                <img src={comment.users.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                comment.users.display_name[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--brown-700)' }}>
                  {comment.users.display_name}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--brown-300)' }}>
                  {timeAgo(comment.created_at)}
                </span>
              </div>
              <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--brown-500)' }}>
                {comment.content}
              </p>
            </div>
            {currentUserId && comment.user_id === currentUserId && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="flex-shrink-0 self-start mt-0.5 transition-colors"
                style={{ color: 'var(--brown-300)' }}
                aria-label="Eliminar comentario"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={300}
            placeholder="Añade un comentario..."
            className="input-cream flex-1"
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="px-4 py-2.5 font-semibold text-sm rounded-2xl transition-opacity flex-shrink-0"
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
        <p className="text-sm text-center py-3" style={{ color: 'var(--brown-300)' }}>
          <a href="/login" style={{ color: 'var(--brown-700)', fontWeight: 600 }}>Inicia sesión</a>
          {' '}para comentar
        </p>
      )}
    </div>
  )
}
