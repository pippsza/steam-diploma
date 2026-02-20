'use client'

/**
 * Telegram Mini App utilities
 */

export function isTMA(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hash.includes('tgWebAppData') ||
    Boolean((window as unknown as Record<string, unknown>).TelegramWebviewProxy) ||
    Boolean((window as unknown as Record<string, unknown>).Telegram)
}

export function getTelegramThemeParams() {
  if (typeof window === 'undefined') return null
  const tg = (window as unknown as Record<string, unknown>).Telegram as Record<string, unknown> | undefined
  const webApp = tg?.WebApp as Record<string, unknown> | undefined
  return (webApp?.themeParams as Record<string, string>) ?? null
}

export function closeMiniApp() {
  if (typeof window === 'undefined') return
  const tg = (window as unknown as Record<string, unknown>).Telegram as Record<string, unknown> | undefined
  const webApp = tg?.WebApp as Record<string, unknown> | undefined
  if (typeof webApp?.close === 'function') {
    ;(webApp.close as () => void)()
  }
}

export function expandMiniApp() {
  if (typeof window === 'undefined') return
  const tg = (window as unknown as Record<string, unknown>).Telegram as Record<string, unknown> | undefined
  const webApp = tg?.WebApp as Record<string, unknown> | undefined
  if (typeof webApp?.expand === 'function') {
    ;(webApp.expand as () => void)()
  }
}

export function getTelegramInitData(): string | null {
  if (typeof window === 'undefined') return null
  const tg = (window as unknown as Record<string, unknown>).Telegram as Record<string, unknown> | undefined
  const webApp = tg?.WebApp as Record<string, unknown> | undefined
  return (webApp?.initData as string) ?? null
}

export function getTelegramUser(): { id: number; username?: string; first_name?: string } | null {
  if (typeof window === 'undefined') return null
  const tg = (window as unknown as Record<string, unknown>).Telegram as Record<string, unknown> | undefined
  const webApp = tg?.WebApp as Record<string, unknown> | undefined
  const initDataUnsafe = webApp?.initDataUnsafe as Record<string, unknown> | undefined
  return (initDataUnsafe?.user as { id: number; username?: string; first_name?: string }) ?? null
}

export function hapticFeedback(type: 'impact' | 'notification' | 'selection' = 'impact') {
  if (typeof window === 'undefined') return
  const tg = (window as unknown as Record<string, unknown>).Telegram as Record<string, unknown> | undefined
  const webApp = tg?.WebApp as Record<string, unknown> | undefined
  const haptic = webApp?.HapticFeedback as Record<string, (...args: unknown[]) => void> | undefined
  if (!haptic) return

  switch (type) {
    case 'impact':
      haptic.impactOccurred?.('medium')
      break
    case 'notification':
      haptic.notificationOccurred?.('success')
      break
    case 'selection':
      haptic.selectionChanged?.()
      break
  }
}
