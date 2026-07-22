'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('No autorizado')
  }
  return user
}

export async function validateCreator(userId: string): Promise<{ error?: string }> {
  try {
    await assertAdmin()
  } catch {
    return { error: 'No autorizado' }
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const [{ error: userError }, { error: reqError }] = await Promise.all([
    admin.from('users').update({ role: 'creator', validated_at: now }).eq('id', userId),
    admin.from('creator_requests').update({ status: 'approved' }).eq('user_id', userId),
  ])

  if (userError) return { error: userError.message }
  if (reqError) return { error: reqError.message }

  // Notify the creator
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  try {
    await admin.from('notifications').insert({
      user_id: userId,
      type: 'follow',
      actor_id: user!.id,
      recipe_id: null,
    })
  } catch {}

  return {}
}

export async function rejectCreator(userId: string): Promise<{ error?: string }> {
  try {
    await assertAdmin()
  } catch {
    return { error: 'No autorizado' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('creator_requests')
    .update({ status: 'rejected' })
    .eq('user_id', userId)

  if (error) return { error: error.message }
  return {}
}

export async function promoteToCreator(userId: string): Promise<{ error?: string }> {
  try {
    await assertAdmin()
  } catch {
    return { error: 'No autorizado' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .update({ role: 'creator', validated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return { error: error.message }
  return {}
}

export async function revokeCreator(creatorId: string): Promise<{ error?: string }> {
  try {
    await assertAdmin()
  } catch {
    return { error: 'No autorizado' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .update({ role: 'consumer', validated_at: null })
    .eq('id', creatorId)

  if (error) return { error: error.message }
  return {}
}
