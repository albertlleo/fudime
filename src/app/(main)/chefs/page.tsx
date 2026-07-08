import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ChefsClient from './chefs-client'
import type { User } from '@/lib/types'

export default async function ChefsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Followed creators
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user!.id)

  const followedIds = (follows ?? []).map(f => f.following_id)

  // All creators (for discovery)
  const { data: allCreators } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, validated_at, bio')
    .eq('role', 'creator')
    .order('display_name')

  const creators = (allCreators ?? []) as Pick<User, 'id' | 'display_name' | 'avatar_url' | 'validated_at' | 'bio'>[]
  const followedSet = new Set(followedIds)

  const following = creators.filter(c => followedSet.has(c.id))
  const discover = creators.filter(c => !followedSet.has(c.id))

  return <ChefsClient following={following} discover={discover} />
}
