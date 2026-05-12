'use client'

import { useState } from 'react'
import { Check, Copy, KeyRound } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface Props {
  activationKey: string
}

export function ActivationKey({ activationKey }: Props) {
  const t = useTranslations('games.activationKey')
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activationKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-lg border border-green-700/40 bg-green-950/20 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <KeyRound className="size-4 text-green-500" />
        {t('title')}
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{t('description')}</p>
      <div className="flex items-center gap-2">
        <code
          className={`flex-1 select-all rounded-md border bg-background/60 px-3 py-2 font-mono text-base tracking-wider transition ${
            revealed ? '' : 'blur-sm hover:blur-none'
          }`}
          onClick={() => setRevealed(true)}
        >
          {activationKey}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          aria-label={t('copy')}
        >
          {copied ? (
            <>
              <Check className="mr-1 size-4 text-green-500" />
              {t('copied')}
            </>
          ) : (
            <>
              <Copy className="mr-1 size-4" />
              {t('copy')}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
