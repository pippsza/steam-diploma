'use client'

import { useTheme } from 'next-themes'
import { useThemeTransition } from '@/hooks/use-theme-transition'
import { ThemeToggleButton } from './theme-toggle-button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { startTransition } = useThemeTransition()

  const handleToggle = () => {
    startTransition(() => {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    })
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
