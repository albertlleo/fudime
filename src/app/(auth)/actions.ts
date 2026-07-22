'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

function isValidUsername(u: string) {
  return /^[a-z0-9_]{3,20}$/.test(u)
}

function getAge(birthdate: string): number {
  const birth = new Date(birthdate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export async function checkUsername(
  username: string
): Promise<{ available: boolean; error?: string }> {
  if (!isValidUsername(username)) return { available: false, error: 'invalid' }
  const admin = createAdminClient()
  const { data } = await admin
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  return { available: !data }
}

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
  const username = (formData.get('username') as string).trim().toLowerCase()
  const birthdate = formData.get('birthdate') as string

  if (!displayName) return { error: 'El nombre completo es obligatorio.' }
  if (!isValidUsername(username)) {
    return { error: 'El nombre de usuario solo puede contener letras minúsculas, números y guiones bajos (3–20 caracteres).' }
  }
  if (!birthdate) return { error: 'La fecha de nacimiento es obligatoria.' }
  if (getAge(birthdate) < 18) return { error: 'Debes tener al menos 18 años para registrarte.' }

  // Check username availability
  const admin = createAdminClient()
  const { data: existingUsername } = await admin
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  if (existingUsername) return { error: 'Este nombre de usuario ya está en uso.' }

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, role: 'consumer' },
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

  const { error: upsertError } = await admin.from('users').upsert({
    id: authData.user.id,
    email,
    display_name: displayName,
    username,
    birthdate,
    role: 'consumer',
    validated_at: null,
  }, { onConflict: 'id' })

  if (upsertError) {
    return { error: 'Error al guardar el perfil. Intenta de nuevo.' }
  }

  if (!authData.session) {
    redirect('/login?confirm=1')
  }

  redirect('/')
}
