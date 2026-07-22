import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import BackButton from '@/components/back-button'
import EditRecipeForm from './edit-recipe-form'
import type { Recipe } from '@/lib/types'

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!data) notFound()

  return (
    <div className="min-h-dvh overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-5 flex items-center gap-3">
        <BackButton fallback="/perfil" />
        <h1 className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>Editar receta</h1>
      </div>
      <EditRecipeForm recipe={data as Recipe} />
    </div>
  )
}
