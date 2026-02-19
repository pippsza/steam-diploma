'use client'

import { useCallback } from 'react'

export const useThemeTransition = () => {
  const startTransition = useCallback((updateFn: () => void) => {
    if ('startViewTransition' in document) {
      ;(document as unknown as { startViewTransition: (fn: () => void) => void }).startViewTransition(updateFn)
    } else {
      updateFn()
    }
  }, [])

  return { startTransition }
}
