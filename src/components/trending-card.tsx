'use client'

import Link from 'next/link'

interface Props {
  recipe: { id: string; title: string; thumbnail_url: string | null; video_url: string }
  href: string
}

export default function TrendingCard({ recipe, href }: Props) {
  return (
    <Link href={href} className="flex-shrink-0 w-28 block">
      <div
        className="relative w-28 rounded-2xl overflow-hidden bg-stone-900"
        style={{ aspectRatio: '9/16' }}
      >
        <video
          src={recipe.video_url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-10">
          <p className="text-white text-[10px] font-semibold line-clamp-1 leading-tight uppercase">{recipe.title}</p>
        </div>
      </div>
    </Link>
  )
}
