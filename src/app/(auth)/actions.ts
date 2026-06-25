'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/types'

export async function loginAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: 'Email o contraseña incorrectos.' }
  }

  redirect('/')
}

export async function registerAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = (formData.get('display_name') as string).trim()
  const role = formData.get('role') as UserRole
  const socialUrl = (formData.get('social_url') as string | null)?.trim() || null

  if (!displayName) return { error: 'El nombre es obligatorio.' }
  if (!['consumer', 'creator'].includes(role)) return { error: 'Rol inválido.' }

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, role },
    },
  })

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      return { error: 'Este email ya está registrado.' }
    }
    return { error: signUpError.message }
  }

  if (!authData.user) {
    return { error: 'No se pudo crear el usuario.' }
  }

  // If email confirmation is required, no session is available yet.
  // The DB row will be created via a trigger or on first login.
  if (!authData.session) {
    redirect('/login?confirm=1')
  }

  let instagramUrl: string | null = null
  let tiktokUrl: string | null = null
  if (socialUrl) {
    if (socialUrl.includes('tiktok.com') || socialUrl.includes('tiktok')) {
      tiktokUrl = socialUrl
    } else {
      instagramUrl = socialUrl
    }
  }

  const { error: insertError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    display_name: displayName,
    role,
    instagram_url: instagramUrl,
    tiktok_url: tiktokUrl,
    validated_at: null,
  })

  if (insertError) {
    return { error: 'Error al guardar el perfil. Intenta de nuevo.' }
  }

  redirect('/')
}
