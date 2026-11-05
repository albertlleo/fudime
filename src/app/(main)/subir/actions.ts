'use server'

import crypto from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { RecipeMacros } from '@/lib/types'

async function calculateMacros(description: string, servings: string | null): Promise<RecipeMacros | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || !description.trim()) return null
  try {
    const client = new Anthropic({ apiKey })
    const servingsHint = servings && servings !== 'mas4' ? `\nRaciones: ${servings}` : servings === 'mas4' ? '\nRaciones: más de 4' : ''
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: 'Eres un nutricionista. Calcula macronutrientes por ración. Responde SOLO con JSON válido, sin texto adicional.',
      messages: [{
        role: 'user',
        content: `Calcula los macros por ración.${servingsHint}\n\nReceta:\n${description.slice(0, 1500)}\n\nFormato: {"kcal": <número>, "protein": <gramos>, "fat": <gramos>, "carbs": <gramos>}`,
      }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const match = text.match(/\{[^}]+\}/)
    if (!match) { console.error('[macros] no JSON in response:', text); return null }
    const p = JSON.parse(match[0])
    if (typeof p.kcal !== 'number' || typeof p.protein !== 'number' || typeof p.fat !== 'number' || typeof p.carbs !== 'number') return null
    return { kcal: Math.round(p.kcal), protein: Math.round(p.protein), fat: Math.round(p.fat), carbs: Math.round(p.carbs) }
  } catch (e) {
    console.error('[macros] error:', e)
    return null
  }
}

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
  servings: string | null
  publish: boolean
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const macros = await calculateMacros(data.description, data.servings)
  const now = new Date().toISOString()

  const { data: recipe, error } = await supabase.from('recipes').insert({
    creator_id: user.id,
    title: data.title.trim(),
    description: data.description.trim() || null,
    video_url: data.videoUrl,
    thumbnail_url: data.thumbnailUrl || null,
    duration_seconds: data.durationSeconds,
    tags: data.tags,
    diet: data.diet,
    cook_time: data.cookTime,
    servings: data.servings || null,
    macros: macros,
    status: data.publish ? 'published' : 'draft',
    published_at: data.publish ? now : null,
  }).select('id').single()

  if (error) return { error: error.message }

  if (data.publish && recipe) {
    try {
      const { data: followers } = await supabase.from('follows').select('follower_id').eq('following_id', user.id)
      if (followers && followers.length > 0) {
        await supabase.from('notifications').insert(
          followers.map(f => ({ user_id: f.follower_id, type: 'new_recipe', actor_id: user.id, recipe_id: recipe.id }))
        )
      }
    } catch {}
  }

  redirect('/')
}
