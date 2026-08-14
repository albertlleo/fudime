'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

interface Props {
  recipe: { id: string; title: string; thumbnail_url: string | null; video_url: string }
  href: string
}

export default function TrendingCard({ recipe, href }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  function startPlay() {
    setPlaying(true)
    videoRef.current?.play().catch(() => {})
  }

  function stopPlay() {
    setPlaying(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <Link href={href} className="flex-shrink-0 w-28 block">
      <div
        className="relative w-28 rounded-2xl overflow-hidden bg-stone-900"
        style={{ aspectRatio: '9/16' }}
        onMouseEnter={startPlay}
        onMouseLeave={stopPlay}
      >
        {recipe.thumbnail_url && (
          <img
            src={recipe.thumbnail_url}
            alt={recipe.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${playing ? 'opacity-0' : 'opacity-100'}`}
          />
        )}
        <video
          ref={videoRef}
          src={recipe.video_url}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {!recipe.thumbnail_url && !playing && (
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🍴</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-10">
          <p className="text-white text-[10px] font-semibold line-clamp-1 leading-tight uppercase">{recipe.title}</p>
        </div>
      </div>
    </Link>
  )
}
