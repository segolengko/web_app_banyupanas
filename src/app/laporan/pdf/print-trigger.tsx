'use client'

import { useEffect } from 'react'

export default function PrintTrigger() {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      window.print()
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  return null
}
