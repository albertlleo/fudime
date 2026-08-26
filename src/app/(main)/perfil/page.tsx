import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ConsumerProfile from './consumer-profile'
import CreatorProfile from './creator-profile'
import type { User, Recipe } from '@/lib/types'
import type { FolderInfo } from './consumer-profile'

export default async function PerfilPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser!.id)
    .single()

  const user = profile as User

  // ── Consumer profile ──
  if (user.role === 'consumer') {
    const { count: followingCount } = await admin
      .from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id)

    const { data: foldersRaw } = await admin
      .from('folders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

    const folderIds = (foldersRaw ?? []).map((f: any) => f.id)
    const { data: savesRaw } = folderIds.length > 0
      ? await supabase.from('saves')
          .select('folder_id, recipes!recipe_id(thumbnail_url)')
          .eq('user_id', user.id)
          .in('folder_id', folderIds)
      : { data: [] }

    const countMap: Record<string, number> = {}
    const coverMap: Record<string, string | null> = {}
    for (const s of savesRaw ?? []) {
      const fid = (s as any).folder_id as string
      countMap[fid] = (countMap[fid] ?? 0) + 1
      if (!coverMap[fid]) coverMap[fid] = (s as any).recipes?.thumbnail_url ?? null
    }

    const folders: FolderInfo[] = (foldersRaw ?? []).map((f: any) => ({
      id: f.id, name: f.name,
      count: countMap[f.id] ?? 0,
      cover: coverMap[f.id] ?? null,
      cover_url: f.cover_url ?? null,
    }))

    return <ConsumerProfile user={user} followingCount={followingCount ?? 0} folders={folders} />
  }

  // ── Creator profile ──
  const [{ data: recipes }, { count: followersCount }, { count: followingCount }, { data: foldersRaw }] = await Promise.all([
    supabase.from('recipes').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
    admin.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
    admin.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
    admin.from('folders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const recipeList = (recipes ?? []) as Recipe[]

  const folderIds = (foldersRaw ?? []).map((f: any) => f.id)
  const { data: savesRaw } = folderIds.length > 0
    ? await supabase.from('saves').select('folder_id, recipes!recipe_id(thumbnail_url)').eq('user_id', user.id).in('folder_id', folderIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  const coverMap: Record<string, string | null> = {}
  for (const s of savesRaw ?? []) {
    const fid = (s as any).folder_id as string
    countMap[fid] = (countMap[fid] ?? 0) + 1
    if (!coverMap[fid]) coverMap[fid] = (s as any).recipes?.thumbnail_url ?? null
  }

  const folders: FolderInfo[] = (foldersRaw ?? []).map((f: any) => ({
    id: f.id, name: f.name,
    count: countMap[f.id] ?? 0,
    cover: coverMap[f.id] ?? null,
    cover_url: f.cover_url ?? null,
  }))

  return (
    <CreatorProfile
      user={user}
      recipes={recipeList}
      followersCount={followersCount ?? 0}
      followingCount={followingCount ?? 0}
      folders={folders}
    />
  )
}
