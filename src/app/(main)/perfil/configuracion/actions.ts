'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function toggleCommentsEnabled(enabled: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('users').update({ comments_enabled: enabled }).eq('id', user.id)
  if (error) return { error: error.message }
  return {}
}

export async function changePassword(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const password = (formData.get('password') as string)?.trim()
  const confirm = (formData.get('confirm') as string)?.trim()

  if (!password || password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true }
}

export async function changeEmail(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  if (!email || !email.includes('@')) return { error: 'Introduce un correo válido.' }
  if (email === user.email) return { error: 'Es el mismo correo que ya tienes.' }

  const { error } = await supabase.auth.updateUser({ email })
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAccount(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const confirmEmail = (formData.get('email') as string)?.trim().toLowerCase()
  if (confirmEmail !== user.email) return { error: 'El correo no coincide. Escríbelo exactamente.' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  await supabase.auth.signOut()
  redirect('/')
}
