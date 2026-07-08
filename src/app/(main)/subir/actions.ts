'use server'

import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getImageUploadSignature(): Promise<{
  signature: string
  timestamp: number
  folder: string
  cloudName: string
  apiKey: string
}> {
  const timestamp = Math.round(Date.now() / 1000)
  const folder = 'fudime/avatars'
  const toSign = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET!}`
  const signature = crypto.createHash('sha1').update(toSign).digest('hex')
  return { signature, timestamp, folder, cloudName: process.env.CLOUDINARY_CLOUD_NAME!, apiKey: process.env.CLOUDINARY_API_KEY! }
}

export async function getUploadSignature(): Promise<{
  signature: string
  timestamp: number
  folder: string
  cloudName: string
  apiKey: string
}> {
  const timestamp = Math.round(Date.now() / 1000)
  const folder = 'fudime/recipes'
  const toSign = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET!}`
  const signature = crypto.createHash('sha1').update(toSign).digest('hex')
  return { signature, timestamp, folder, cloudName: process.env.CLOUDINARY_CLOUD_NAME!, apiKey: process.env.CLOUDINARY_API_KEY! }
}

export async function createRecipe(data: {
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  durationSeconds: number | null
  tags: string[]
  diet: string[]
  cookTime: string | null
  publish: boolean
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const now = new Date().toISOString()

  const { error } = await supabase.from('recipes').insert({
    creator_id: user.id,
    title: data.title.trim(),
    description: data.description.trim() || null,
    video_url: data.videoUrl,
    thumbnail_url: data.thumbnailUrl || null,
    duration_seconds: data.durationSeconds,
    tags: data.tags,
    diet: data.diet,
    cook_time: data.cookTime,
    status: data.publish ? 'published' : 'draft',
    published_at: data.publish ? now : null,
  })

  if (error) return { error: error.message }

  redirect('/')
}
