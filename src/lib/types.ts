export type UserRole = 'consumer' | 'creator'
export type RecipeStatus = 'draft' | 'published'

export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  role: UserRole
  instagram_url: string | null
  tiktok_url: string | null
  validated_at: string | null
  created_at: string
}

export interface Recipe {
  id: string
  creator_id: string
  title: string
  description: string | null
  video_url: string
  thumbnail_url: string | null
  duration_seconds: number | null
  status: RecipeStatus
  published_at: string | null
  created_at: string
  tags: string[]
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Save {
  id: string
  user_id: string
  recipe_id: string
  folder_id: string | null
  saved_at: string
}

export interface RecipeWithCreator extends Recipe {
  users: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'validated_at'>
  likes_count?: number
  saves_count?: number
  user_has_liked?: boolean
  user_has_saved?: boolean
}
