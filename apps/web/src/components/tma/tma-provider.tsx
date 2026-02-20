'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Script from 'next/script'
import { signIn, useSession } from 'next-auth/react'
import { expandMiniApp, getTelegramThemeParams, getTelegramInitData } from '@/lib/tma'

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
  const { status } = useSession()
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false)

  useEffect(() => {
    expandMiniApp()
    applyTelegramTheme()
  }, [])

  // Auto-login via Telegram initData
  useEffect(() => {
    if (status !== 'unauthenticated' || autoLoginAttempted) return
    setAutoLoginAttempted(true)

    const initData = getTelegramInitData()
    if (!initData) return

    fetch('/api/auth/telegram-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user?.email) {
          // Trigger Google sign-in with the matched account
          signIn('google', { redirect: false })
        }
      })
      .catch(() => {
        // Silently fail — user can still use TMA without login
      })
  }, [status, autoLoginAttempted])

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
