import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local manually
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '../.env.local')
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const [k, ...v] = line.split('=')
  if (k && v.length) process.env[k.trim()] = v.join('=').trim()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function main() {
  // 1. Fetch all recipes to get Cloudinary public_ids
  const { data: recipes, error } = await supabase.from('recipes').select('id, video_url, thumbnail_url')
  if (error) { console.error('Error fetching recipes:', error.message); process.exit(1) }
  console.log(`Found ${recipes.length} recipes`)

  // 2. Extract Cloudinary public_ids from URLs
  const videoIds = []
  const imageIds = []
  for (const r of recipes) {
    if (r.video_url) {
      const m = r.video_url.match(/\/upload\/(?:[^/]+\/)*(.+)\.\w+$/)
      if (m) videoIds.push(m[1])
    }
    if (r.thumbnail_url && !r.thumbnail_url.includes('so_auto')) {
      const m = r.thumbnail_url.match(/\/upload\/(?:[^/]+\/)*(.+)\.\w+$/)
      if (m) imageIds.push(m[1])
    }
  }

  // 3. Delete from Cloudinary in batches of 100
  if (videoIds.length) {
    for (let i = 0; i < videoIds.length; i += 100) {
      const batch = videoIds.slice(i, i + 100)
      const res = await cloudinary.api.delete_resources(batch, { resource_type: 'video' })
      console.log(`Deleted videos batch ${i/100 + 1}:`, Object.keys(res.deleted).length, 'assets')
    }
  }
  if (imageIds.length) {
    for (let i = 0; i < imageIds.length; i += 100) {
      const batch = imageIds.slice(i, i + 100)
      const res = await cloudinary.api.delete_resources(batch, { resource_type: 'image' })
      console.log(`Deleted images batch ${i/100 + 1}:`, Object.keys(res.deleted).length, 'assets')
    }
  }

  // 4. Delete related rows first (in case no CASCADE)
  for (const table of ['notifications', 'comments', 'likes', 'saves']) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) console.warn(`Warning deleting ${table}:`, error.message)
    else console.log(`Cleared ${table}`)
  }

  // 5. Delete all recipes
  const { error: recipeErr } = await supabase.from('recipes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (recipeErr) { console.error('Error deleting recipes:', recipeErr.message); process.exit(1) }
  console.log('✓ All recipes deleted')
  console.log('Done — database and Cloudinary are clean.')
}

main().catch(e => { console.error(e); process.exit(1) })
