'use client'

import { useEffect, type ReactNode } from 'react'
import Script from 'next/script'
import { expandMiniApp, getTelegramThemeParams } from '@/lib/tma'

function applyTelegramTheme() {
  const params = getTelegramThemeParams()
  if (!params) return

  const root = document.documentElement
  if (params.bg_color) {
    root.style.setProperty('--background', params.bg_color)
  }
  if (params.text_color) {
    root.style.setProperty('--foreground', params.text_color)
  }
  if (params.secondary_bg_color) {
    root.style.setProperty('--muted', params.secondary_bg_color)
  }
  if (params.button_color) {
    root.style.setProperty('--primary', params.button_color)
  }
  if (params.button_text_color) {
    root.style.setProperty('--primary-foreground', params.button_text_color)
  }
}

export function TMAProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    expandMiniApp()
    applyTelegramTheme()
  }, [])

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
      />
      {children}
    </>
  )
}
