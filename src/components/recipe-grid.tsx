import Link from 'next/link'
import type { RecipeWithCreator } from '@/lib/types'

function RecipeCard({ recipe, href }: { recipe: RecipeWithCreator; href: string }) {
  return (
    <Link href={href} className="block">
      <div className="relative aspect-[3/4] bg-stone-900 overflow-hidden">
        {recipe.thumbnail_url ? (
          <img
            src={recipe.thumbnail_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🍴</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5">
          <p className="text-white text-xs font-bold line-clamp-1 leading-tight">{recipe.title}</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>@{recipe.users.display_name}</p>
        </div>
        {(recipe.likes_count ?? 0) > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <svg viewBox="0 0 24 24" fill="#ff2d55" className="w-3 h-3">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <span className="text-white text-[10px] font-bold">
              {(recipe.likes_count ?? 0) >= 1000
                ? ((recipe.likes_count ?? 0) / 1000).toFixed(1).replace('.0', '') + 'K'
                : recipe.likes_count}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

interface RecipeGridProps {
  recipes: RecipeWithCreator[]
  emptyIcon: string
  emptyTitle: string
  emptyText: string
  feedBase?: string
}

export default function RecipeGrid({ recipes, emptyIcon, emptyTitle, emptyText, feedBase }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-8 py-20">
        <span className="text-5xl mb-4">{emptyIcon}</span>
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--brown-900)' }}>{emptyTitle}</h2>
        <p className="text-sm" style={{ color: 'var(--brown-500)' }}>{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {recipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          href={feedBase ? `${feedBase}?start=${recipe.id}` : `/receta/${recipe.id}`}
        />
      ))}
    </div>
  )
}
