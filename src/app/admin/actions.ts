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

export async function validateCreator(creatorId: string): Promise<{ error?: string }> {
  try {
    await assertAdmin()
  } catch {
    return { error: 'No autorizado' }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('users')
    .update({ validated_at: new Date().toISOString() })
    .eq('id', creatorId)

  if (error) return { error: error.message }

  // Notify the creator
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  try {
    await admin.from('notifications').insert({
      user_id: creatorId,
      type: 'follow',
      actor_id: user!.id,
      recipe_id: null,
    })
  } catch {}

  return {}
}

export async function rejectCreator(creatorId: string): Promise<{ error?: string }> {
  try {
    await assertAdmin()
  } catch {
    return { error: 'No autorizado' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .update({ role: 'consumer' })
    .eq('id', creatorId)

  if (error) return { error: error.message }
  return {}
}
