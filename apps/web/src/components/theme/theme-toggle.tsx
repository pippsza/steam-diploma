'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useThemeTransition } from '@/hooks/use-theme-transition'
import { ThemeToggleButton } from './theme-toggle-button'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { startTransition } = useThemeTransition()

  useEffect(() => setMounted(true), [])

  const handleToggle = () => {
    startTransition(() => {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    })
  }

  if (!mounted) {
    return <Button variant="ghost" size="icon" disabled className="opacity-0" />
  }

  return (
    <ThemeToggleButton
      theme={(theme as 'light' | 'dark') ?? 'light'}
      variant="circle"
      start="top-right"
      onClick={handleToggle}
    />
  )
}
