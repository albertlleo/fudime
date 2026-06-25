'use server'

import { createClient } from '@/lib/supabase/server'
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

export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const display_name = (formData.get('display_name') as string)?.trim()
  const bio = (formData.get('bio') as string)?.trim() || null
  const instagram_url = (formData.get('instagram_url') as string)?.trim() || null
  const tiktok_url = (formData.get('tiktok_url') as string)?.trim() || null
  const avatar_url = (formData.get('avatar_url') as string)?.trim() || null

  await supabase.from('users').update({
    ...(display_name && { display_name }),
    bio,
    instagram_url,
    tiktok_url,
    avatar_url,
  }).eq('id', user.id)

  redirect('/perfil')
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
