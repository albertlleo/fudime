'use client'

import { useState, useRef } from 'react'
import { addComment, deleteComment, toggleCommentLike } from './comment-actions'
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

function Avatar({ user }: { user: { display_name: string; avatar_url: string | null } }) {
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center text-black font-bold text-xs flex-shrink-0 overflow-hidden"
      style={{ background: 'var(--amber)' }}
    >
      {user.avatar_url ? (
        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        user.display_name[0].toUpperCase()
      )}
    </div>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-3.5 h-3.5"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function CommentRow({
  comment,
  isReply,
  currentUserId,
  onLike,
  onDelete,
  onReply,
}: {
  comment: CommentWithUser
  isReply?: boolean
  currentUserId: string | null
  onLike: (id: string) => void
  onDelete: (id: string) => void
  onReply?: (id: string, username: string) => void
}) {
  const liked = comment.user_has_liked ?? false
  const count = comment.likes_count ?? 0

  return (
    <div className="flex gap-3">
      <Avatar user={comment.users} />
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
        <div className="flex items-center gap-3 mt-1.5">
          <button
            onClick={() => onLike(comment.id)}
            disabled={!currentUserId}
            className="flex items-center gap-1 transition-opacity"
            style={{ color: liked ? '#dc2626' : 'var(--brown-300)', opacity: !currentUserId ? 0.4 : 1 }}
          >
            <HeartIcon filled={liked} />
            {count > 0 && (
              <span className="text-[10px] font-semibold">{count}</span>
            )}
          </button>
          {!isReply && onReply && currentUserId && (
            <button
              onClick={() => onReply(comment.id, comment.users.display_name)}
              className="text-[10px] font-semibold transition-colors"
              style={{ color: 'var(--brown-400)' }}
            >
              Responder
            </button>
          )}
        </div>
      </div>
      {currentUserId && comment.user_id === currentUserId && (
        <button
          onClick={() => onDelete(comment.id)}
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
  )
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
  const [allComments, setAllComments] = useState(initialComments)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const topComments = allComments.filter(c => !c.parent_id)
  const repliesByParent = allComments.reduce<Record<string, CommentWithUser[]>>((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = []
      acc[c.parent_id].push(c)
    }
    return acc
  }, {})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || submitting || !currentUserId) return
    setSubmitting(true)
    const result = await addComment(recipeId, text.trim(), replyingTo?.id)
    if (result.comment) {
      setAllComments(prev => [...prev, result.comment!])
      setText('')
      setReplyingTo(null)
    }
    setSubmitting(false)
  }

  async function handleDelete(commentId: string) {
    await deleteComment(commentId)
    setAllComments(prev => prev.filter(c => c.id !== commentId))
  }

  async function handleLike(commentId: string) {
    if (!currentUserId) return
    const result = await toggleCommentLike(commentId)
    if (!result.error) {
      setAllComments(prev =>
        prev.map(c =>
          c.id === commentId ? { ...c, likes_count: result.count, user_has_liked: result.liked } : c,
        ),
      )
    }
  }

  function startReply(id: string, username: string) {
    setReplyingTo({ id, username })
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div>
      <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--brown-900)' }}>
        {allComments.length > 0
          ? `${allComments.length} comentario${allComments.length !== 1 ? 's' : ''}`
          : 'Comentarios'}
      </h3>

      {topComments.length === 0 && (
        <p className="text-sm mb-4" style={{ color: 'var(--brown-300)' }}>
          Sé el primero en comentar
        </p>
      )}

      <div className="space-y-5 mb-5">
        {topComments.map(comment => {
          const replies = repliesByParent[comment.id] ?? []
          return (
            <div key={comment.id}>
              <CommentRow
                comment={comment}
                currentUserId={currentUserId}
                onLike={handleLike}
                onDelete={handleDelete}
                onReply={startReply}
              />
              {replies.length > 0 && (
                <div className="ml-11 mt-3 space-y-3 pl-3 border-l-2" style={{ borderColor: 'var(--brown-100)' }}>
                  {replies.map(reply => (
                    <CommentRow
                      key={reply.id}
                      comment={reply}
                      isReply
                      currentUserId={currentUserId}
                      onLike={handleLike}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {currentUserId ? (
        <div>
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-xs" style={{ color: 'var(--brown-400)' }}>
                Respondiendo a{' '}
                <span className="font-semibold" style={{ color: 'var(--brown-700)' }}>
                  @{replyingTo.username}
                </span>
              </span>
              <button
                onClick={() => setReplyingTo(null)}
                className="ml-auto flex-shrink-0"
                style={{ color: 'var(--brown-300)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={300}
              placeholder={replyingTo ? `Responder a @${replyingTo.username}...` : 'Añade un comentario...'}
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
        </div>
      ) : (
        <p className="text-sm text-center py-3" style={{ color: 'var(--brown-300)' }}>
          <a href="/login" style={{ color: 'var(--brown-700)', fontWeight: 600 }}>Inicia sesión</a>
          {' '}para comentar
        </p>
      )}
    </div>
  )
}
