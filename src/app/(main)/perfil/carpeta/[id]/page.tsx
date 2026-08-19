import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import FolderClient from './folder-client'
import type { RecipeWithCreator, Folder } from '@/lib/types'

export default async function FolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: folder } = await admin
    .from('folders').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!folder) notFound()

  const [{ data: inFolderSaves }, { data: otherSaves }] = await Promise.all([
    supabase.from('saves')
      .select('recipe_id, recipes(*, users!creator_id(id, display_name, avatar_url, validated_at))')
      .eq('user_id', user.id)
      .eq('folder_id', id)
      .order('saved_at', { ascending: false }),
    supabase.from('saves')
      .select('recipe_id, recipes(*, users!creator_id(id, display_name, avatar_url, validated_at))')
      .eq('user_id', user.id)
      .or(`folder_id.is.null,folder_id.neq.${id}`)
      .order('saved_at', { ascending: false }),
  ])

  const recipesInFolder = (inFolderSaves ?? []).map(s => s.recipes).filter(Boolean) as unknown as RecipeWithCreator[]
  const recipesNotInFolder = (otherSaves ?? []).map(s => s.recipes).filter(Boolean) as unknown as RecipeWithCreator[]

  return (
    <FolderClient
      folder={folder as Folder}
      recipesInFolder={recipesInFolder}
      recipesNotInFolder={recipesNotInFolder}
    />
  )
}
