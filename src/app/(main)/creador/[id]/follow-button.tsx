'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (loading) return
    const prev = following
    const next = !prev

    setFollowing(next)
    setCount(c => c + (next ? 1 : -1))
    setLoading(true)

    try {
      const { isFollowing } = await toggleFollow(creatorId)
      setFollowing(isFollowing)
      setCount(c => c + (isFollowing ? 1 : -1) - (next ? 1 : -1))
      router.refresh()
    } catch {
      setFollowing(prev)
      setCount(c => c + (prev ? 1 : -1) - (next ? 1 : -1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="w-full py-2.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
      style={following
        ? { background: '#fff', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }
        : { background: 'var(--amber)', color: '#000' }
      }
    >
      {loading ? '...' : following ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}
