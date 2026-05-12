'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MoodSurveyDialog } from './mood-survey-dialog'

const AUTO_POPUP_DELAY_MS = 30 * 60 * 1000 // 30 minutes
const SNOOZE_KEY = 'moodSurvey:snoozeUntil'
const LAST_SHOWN_KEY = 'moodSurvey:lastShown'

function isSnoozed(): boolean {
  if (typeof window === 'undefined') return true
  const until = window.localStorage.getItem(SNOOZE_KEY)
  if (!until) return false
  const ts = parseInt(until, 10)
  return Number.isFinite(ts) && Date.now() < ts
}

function snoozeUntilTomorrow() {
  const tomorrow = new Date()
  tomorrow.setHours(24, 0, 0, 0)
  window.localStorage.setItem(SNOOZE_KEY, String(tomorrow.getTime()))
}

export function MoodSurveyTrigger() {
  const t = useTranslations('survey')
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [autoShown, setAutoShown] = useState(false)

  // Auto-popup after AUTO_POPUP_DELAY_MS of session activity.
  useEffect(() => {
    if (!session?.user || autoShown) return
    if (isSnoozed()) return

    const lastShown = window.localStorage.getItem(LAST_SHOWN_KEY)
    const lastShownTs = lastShown ? parseInt(lastShown, 10) : 0
    const now = Date.now()
    if (lastShownTs && now - lastShownTs < AUTO_POPUP_DELAY_MS) {
      // Schedule for the remainder of the interval.
      const wait = AUTO_POPUP_DELAY_MS - (now - lastShownTs)
      const id = setTimeout(() => {
        if (!isSnoozed()) {
          setOpen(true)
          setAutoShown(true)
          window.localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()))
        }
      }, wait)
      return () => clearTimeout(id)
    }

    const id = setTimeout(() => {
      if (!isSnoozed()) {
        setOpen(true)
        setAutoShown(true)
        window.localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()))
      }
    }, AUTO_POPUP_DELAY_MS)
    return () => clearTimeout(id)
  }, [session, autoShown])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next && autoShown) {
      // If user closed the auto-popup without finishing, snooze for the rest of the day.
      snoozeUntilTomorrow()
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('triggerAria')}
            onClick={() => setOpen(true)}
          >
            <Sparkles className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('triggerTooltip')}</TooltipContent>
      </Tooltip>

      <MoodSurveyDialog open={open} onOpenChange={handleOpenChange} />
    </>
  )
}
