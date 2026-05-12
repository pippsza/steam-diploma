'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Copy, KeyRound, ShoppingCart, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatPrice } from '@/lib/game-status'
import { getSteamHeaderImage } from '@/lib/steam'
import { purchaseGame } from '@/actions/purchases'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: string
  appid: number
  name: string
  headerImage?: string | null
  isFree: boolean
  priceCents: number
  currency?: string | null
  onPurchased: () => void
}

type Phase =
  | { kind: 'confirm' }
  | { kind: 'success'; activationKey: string }
  | { kind: 'error'; message: string }

export function PurchaseDialog({
  open,
  onOpenChange,
  gameId,
  appid,
  name,
  headerImage,
  isFree,
  priceCents,
  currency,
  onPurchased,
}: Props) {
  const t = useTranslations('games.purchase')
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>({ kind: 'confirm' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const imageUrl = headerImage || getSteamHeaderImage(appid)
  const priceLabel = isFree ? t('free') : formatPrice(priceCents, currency)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    const result = await purchaseGame(gameId, priceCents)
    setIsSubmitting(false)
    if (result.success) {
      setPhase({ kind: 'success', activationKey: result.activationKey ?? '' })
      onPurchased()
      router.refresh()
    } else {
      setPhase({ kind: 'error', message: result.error ?? t('errorGeneric') })
    }
  }

  const handleClose = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      // Reset phase after the closing animation finishes
      setTimeout(() => setPhase({ kind: 'confirm' }), 200)
    }
  }

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {phase.kind === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>{isFree ? t('confirmFreeTitle') : t('confirmTitle')}</DialogTitle>
              <DialogDescription>
                {isFree ? t('confirmFreeDescription') : t('confirmDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <div className="relative aspect-[460/215] w-32 shrink-0 overflow-hidden rounded">
                <Image src={imageUrl} alt={name} fill className="object-cover" sizes="128px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-medium">{name}</p>
                <p className={`text-sm font-bold ${isFree ? 'text-green-500' : ''}`}>
                  {priceLabel}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
                {t('cancel')}
              </Button>
              <Button onClick={handleConfirm} disabled={isSubmitting}>
                <ShoppingCart className="mr-2 size-4" />
                {isSubmitting
                  ? t('processing')
                  : isFree
                    ? t('getFree')
                    : t('confirmButton', { price: priceLabel })}
              </Button>
            </DialogFooter>
          </>
        )}

        {phase.kind === 'success' && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-green-600/20">
                <Sparkles className="size-6 text-green-500" />
              </div>
              <DialogTitle className="text-center">{t('successTitle')}</DialogTitle>
              <DialogDescription className="text-center">
                {t('successDescription', { name })}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-green-700/40 bg-green-950/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <KeyRound className="size-4 text-green-500" />
                {t('keyTitle')}
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 select-all rounded-md border bg-background/60 px-3 py-2 text-center font-mono text-base tracking-wider">
                  {phase.activationKey}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyKey(phase.activationKey)}
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
              <p className="mt-2 text-xs text-muted-foreground">{t('keyHint')}</p>
            </div>

            <DialogFooter>
              <Button onClick={() => handleClose(false)} className="w-full">
                {t('done')}
              </Button>
            </DialogFooter>
          </>
        )}

        {phase.kind === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('errorTitle')}</DialogTitle>
              <DialogDescription>{phase.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => handleClose(false)} className="w-full">
                {t('close')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
