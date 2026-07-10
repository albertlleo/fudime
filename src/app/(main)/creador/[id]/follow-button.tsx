'use client'

import { useState } from 'react'
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

  function handleToggle() {
    const wasFollowing = following
    setFollowing(v => !v)
    setCount(v => v + (wasFollowing ? -1 : 1))
    toggleFollow(creatorId)
  }

  return (
    <button
      onClick={handleToggle}
      className="w-full py-2.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]"
      style={following
        ? { background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }
        : { background: 'var(--amber)', color: '#000' }
      }
    >
      {following ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}
