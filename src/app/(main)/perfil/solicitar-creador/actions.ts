'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitCreatorRequest(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const instagram_url = (formData.get('instagram_url') as string)?.trim() || null
  const tiktok_url = (formData.get('tiktok_url') as string)?.trim() || null
  const other_links = (formData.get('other_links') as string)?.trim() || null

  if (!instagram_url && !tiktok_url && !other_links) {
    return { error: 'Añade al menos un enlace de tus redes sociales.' }
  }

  const { error } = await supabase.from('creator_requests').upsert({
    user_id: user.id,
    instagram_url,
    tiktok_url,
    other_links,
    status: 'pending',
  }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  return {}
}
