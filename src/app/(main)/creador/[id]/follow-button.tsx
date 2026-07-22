'use client'

import { useState, useTransition } from 'react'
import { toggleFollow } from '@/app/(main)/actions'

export default function FollowButton({
  creatorId,
  isFollowing: initialFollowing,
  followersCount: initialCount,
}: {
  creatorId: string
  isFollowing: boolean
  followersCount: number
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    if (pending) return
    const prev = following
    const next = !prev

    // Optimistic update
    setFollowing(next)
    setCount(c => c + (next ? 1 : -1))

    startTransition(async () => {
      try {
        const { isFollowing } = await toggleFollow(creatorId)
        // Sync to actual DB state (corrects any mismatch)
        setFollowing(isFollowing)
        if (isFollowing !== next) {
          setCount(c => c - (next ? 1 : -1) + (isFollowing ? 1 : -1))
        }
      } catch {
        // Rollback on error
        setFollowing(prev)
        setCount(c => c + (prev ? 1 : -1))
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className="w-full py-2.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
      style={following
        ? { background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }
        : { background: 'var(--amber)', color: '#000' }
      }
    >
      {following ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}
