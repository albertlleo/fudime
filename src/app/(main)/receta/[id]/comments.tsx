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
  currentUserId: string
}) {
  const [comments, setComments] = useState(initialComments)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || submitting) return
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
    <div className="mt-6">
      <h3 className="text-white font-semibold text-sm mb-4">
        {comments.length > 0 ? `${comments.length} comentario${comments.length !== 1 ? 's' : ''}` : 'Comentarios'}
      </h3>

      {comments.length === 0 && (
        <p className="text-stone-500 text-sm mb-4">Sé el primero en comentar</p>
      )}

      <div className="space-y-4 mb-6">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
              {comment.users.avatar_url ? (
                <img src={comment.users.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                comment.users.display_name[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-white text-xs font-semibold">{comment.users.display_name}</span>
                <span className="text-stone-500 text-[10px]">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="text-stone-300 text-sm mt-0.5 leading-relaxed">{comment.content}</p>
            </div>
            {comment.user_id === currentUserId && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-stone-600 hover:text-red-400 transition-colors flex-shrink-0 self-start mt-1"
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 pb-4">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={300}
          placeholder="Añade un comentario..."
          className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-xl transition-colors flex-shrink-0"
        >
          {submitting ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  )
}
