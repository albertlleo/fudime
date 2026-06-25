'use client'

import { useEffect } from 'react'
import { markAllRead } from './actions'

export default function MarkRead() {
  useEffect(() => {
    markAllRead()
  }, [])
  return null
}
