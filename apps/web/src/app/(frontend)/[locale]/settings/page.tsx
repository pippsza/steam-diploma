'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthRequired } from '@/components/auth/auth-required'
import { Loader2, Link2, Unlink, CheckCircle, Copy, Check, ExternalLink } from 'lucide-react'
import { getTelegramBotUsername } from '@/actions/support'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const { data: session, status } = useSession()
  const [code, setCode] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)
  const [linked, setLinked] = useState(false)
  const [linkedUsername, setLinkedUsername] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [botUsername, setBotUsername] = useState<string | null>(null)

  // Fetch bot username for the link
  useEffect(() => {
    getTelegramBotUsername().then(setBotUsername)
  }, [])

  // Check initial link status
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/telegram/link-status?token=_check')
      .then((r) => r.json())
      .then((data) => {
        if (data.linked) {
          setLinked(true)
          setLinkedUsername(data.username || null)
        }
      })
      .catch(() => {})
  }, [status])

  // Poll for link confirmation
  useEffect(() => {
    if (!linking || !code) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/telegram/link-status?token=${code}`)
        const data = await res.json()
        if (data.linked) {
          setLinked(true)
          setLinkedUsername(data.username || null)
          setLinking(false)
          setCode(null)
        } else if (data.expired) {
          setExpired(true)
          setLinking(false)
          setCode(null)
        }
      } catch {}
    }, 2000)
    return () => clearInterval(interval)
  }, [linking, code])

  const handleGenerateCode = useCallback(async () => {
    setGenerating(true)
    setExpired(false)
    try {
      const res = await fetch('/api/telegram/generate-link', { method: 'POST' })
      const data = await res.json()
      setCode(data.code)
      setLinking(true)
    } catch {
      // ignore
    }
    setGenerating(false)
  }, [])

  const handleUnlink = useCallback(async () => {
    setUnlinking(true)
    try {
      await fetch('/api/telegram/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlink: true }),
      })
      setLinked(false)
      setLinkedUsername(null)
    } catch {}
    setUnlinking(false)
  }, [])

  const handleCopyCode = useCallback(() => {
    if (!code) return
    navigator.clipboard.writeText(`/link ${code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  if (status === 'loading') {
    return (
      <div className="container flex max-w-2xl justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container max-w-2xl py-8">
        <AuthRequired message={t('signInRequired')} />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-2 text-2xl font-bold">{t('title')}</h1>
      <p className="mb-8 text-muted-foreground">{t('subtitle')}</p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {t('telegramSection')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('telegramDescription')}</p>

          {linked ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                {t('telegramLinked')} {linkedUsername ? `@${linkedUsername}` : 'Telegram'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlink}
                disabled={unlinking}
              >
                {unlinking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="mr-2 h-4 w-4" />
                )}
                {t('unlinkTelegram')}
              </Button>
            </div>
          ) : linking && code ? (
            <div className="space-y-4">
              <div className="rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400">
                {t('telegramLinkCodeHint')}
              </div>
              <div className="flex items-center justify-center gap-3">
                <code className="rounded-lg bg-muted px-6 py-3 text-2xl font-mono font-bold tracking-[0.3em]">
                  {code}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                  title={t('copyCode')}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {t('sendLinkCommand')} <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">/link {code}</code>
              </p>
              {botUsername && (
                <div className="flex justify-center">
                  <a
                    href={`https://t.me/${botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t('openBot')}
                    </Button>
                  </a>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('telegramLinking')}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {expired && (
                <p className="text-sm text-red-500">{t('linkExpired')}</p>
              )}
              <Button onClick={handleGenerateCode} disabled={generating}>
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="mr-2 h-4 w-4" />
                )}
                {t('linkTelegram')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
