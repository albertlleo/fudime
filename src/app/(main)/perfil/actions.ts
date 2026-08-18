'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function publishRecipe(recipeId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('recipes')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', recipeId)
    .eq('creator_id', user.id)

  if (error) return { error: error.message }
  return {}
}

export async function updateProfile(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const display_name = (formData.get('display_name') as string)?.trim()
  const rawUsername = (formData.get('username') as string)?.trim().toLowerCase()
  const username = rawUsername && /^[a-z0-9_]{3,20}$/.test(rawUsername) ? rawUsername : undefined
  const bio = (formData.get('bio') as string)?.trim() || null
  let website_url = (formData.get('website_url') as string)?.trim() || null
  if (website_url && !/^https?:\/\//i.test(website_url)) {
    website_url = 'https://' + website_url
  }
  const avatar_url = (formData.get('avatar_url') as string)?.trim() || null

  const admin = createAdminClient()

  // Check username uniqueness (skip if unchanged)
  if (username) {
    const { data: existing } = await admin
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle()
    if (existing) return { error: 'Este nombre de usuario ya está en uso. Elige otro.' }
  }

  const { error: dbError } = await admin.from('users').update({
    ...(display_name && { display_name }),
    ...(username && { username }),
    bio,
    website_url,
    avatar_url,
  }).eq('id', user.id)

  if (dbError) {
    console.error('[updateProfile]', dbError.code, dbError.message, dbError.details)
    return { error: dbError.message || 'Error al guardar los cambios.' }
  }

  return { success: true }
}

export async function deleteRecipe(recipeId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Verify ownership
  const { data: recipe } = await supabase
    .from('recipes')
    .select('creator_id, video_url')
    .eq('id', recipeId)
    .single()

  if (!recipe || recipe.creator_id !== user.id) return { error: 'Sin permiso' }

  // Delete related rows first (in case FK has no cascade)
  await Promise.all([
    supabase.from('likes').delete().eq('recipe_id', recipeId),
    supabase.from('saves').delete().eq('recipe_id', recipeId),
  ])

  // Delete recipe from DB
  const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
  if (error) return { error: error.message }

  // Delete video from Cloudinary (best-effort)
  try {
    const url = recipe.video_url
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)
    if (match) {
      await cloudinary.uploader.destroy(match[1], { resource_type: 'video' })
    }
  } catch {}

  return {}
}
