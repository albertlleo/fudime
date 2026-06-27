'use client'

import { useState, useEffect } from 'react'

const SLIDES = [
  {
    emoji: '🎬',
    title: 'Recetas en vídeo',
    text: 'Descubre recetas cortas de creadores reales. Scroll vertical, como TikTok.',
  },
  {
    emoji: '❤️',
    title: 'Guarda tus favoritas',
    text: 'Dale like o guarda las recetas que quieres hacer. Las tendrás siempre a mano.',
  },
  {
    emoji: '👨‍🍳',
    title: 'Sigue a tus creadores',
    text: 'Sigue a los chefs que más te inspiran y verás sus recetas en tu feed.',
  },
]

export default function Onboarding() {
  const [visible, setVisible] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem('fudime_onboarded')) {
      setVisible(true)
    }
  }, [])

  function finish() {
    localStorage.setItem('fudime_onboarded', '1')
    setVisible(false)
  }

  if (!visible) return null

  const current = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-sm flex items-end">
      <div className="w-full bg-white rounded-t-3xl p-8 pb-10">
        {/* Dots */}
        <div className="flex justify-center gap-1.5 mb-8">
          {SLIDES.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-6 bg-amber-500' : 'w-1.5 bg-stone-200'}`} />
          ))}
        </div>

        <div className="text-center mb-8">
          <span className="text-6xl">{current.emoji}</span>
          <h2 className="text-2xl font-bold text-stone-900 mt-4 mb-2">{current.title}</h2>
          <p className="text-stone-500 leading-relaxed">{current.text}</p>
        </div>

        <div className="flex gap-3">
          {!isLast && (
            <button onClick={finish} className="flex-1 py-3 rounded-xl text-stone-400 text-sm font-medium">
              Saltar
            </button>
          )}
          <button
            onClick={() => isLast ? finish() : setSlide(s => s + 1)}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {isLast ? '¡Empezar!' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}
