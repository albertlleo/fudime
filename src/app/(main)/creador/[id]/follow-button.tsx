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
      className={`px-8 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
        following
          ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          : 'bg-amber-500 text-black hover:bg-amber-400'
      }`}
    >
      {following ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}
