'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { signIn, useSession } from 'next-auth/react'
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useChatContext } from '@/components/ai/chat-provider'
import {
  saveMoodSurvey,
  pickGamesFromSurvey,
  type Mood,
  type Vibe,
  type Social,
  type SessionLength,
  type Novelty,
  type SurveyAnswers,
} from '@/actions/mood-surveys'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MOODS: Mood[] = [
  'chill',
  'intense',
  'competitive',
  'adventurous',
  'thoughtful',
  'creative',
  'social',
  'nostalgic',
  'scary',
  'sad',
  'happy',
  'bored',
]

const GENRES = [
  'Action',
  'Adventure',
  'RPG',
  'Strategy',
  'Simulation',
  'Sports',
  'Racing',
  'Casual',
  'Indie',
  'Massively Multiplayer',
]

type Draft = Partial<SurveyAnswers>

const STEPS = ['mood', 'vibe', 'social', 'genre', 'sessionLength', 'novelty'] as const
type StepName = (typeof STEPS)[number]

export function MoodSurveyDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('survey')
  const router = useRouter()
  const locale = useLocale()
  const { data: session } = useSession()
  const { setToolAction } = useChatContext()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>({})
  const [isPending, startTransition] = useTransition()

  const isAuthed = !!session?.user

  if (!isAuthed) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('signInRequiredTitle')}</DialogTitle>
            <DialogDescription>{t('signInRequiredDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('close')}
            </Button>
            <Button onClick={() => signIn('google')}>{t('signIn')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const currentStep: StepName = STEPS[step]

  const canProceed = (() => {
    switch (currentStep) {
      case 'mood':
        return !!draft.mood
      case 'vibe':
        return !!draft.vibe
      case 'social':
        return !!draft.social
      case 'genre':
        return true // optional
      case 'sessionLength':
        return !!draft.sessionLength
      case 'novelty':
        return !!draft.novelty
    }
  })()

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
      return
    }
    // Finish
    startTransition(async () => {
      const answers: SurveyAnswers = {
        mood: draft.mood!,
        vibe: draft.vibe!,
        social: draft.social!,
        genre: draft.genre ?? null,
        sessionLength: draft.sessionLength!,
        novelty: draft.novelty!,
      }

      const [games] = await Promise.all([
        pickGamesFromSurvey(answers),
        saveMoodSurvey(answers),
      ])

      if (games.length > 0) {
        setToolAction({
          type: 'search_games',
          games: games.map((g) => ({
            appid: g.appid,
            name: g.name,
            headerImage: g.headerImage ?? null,
            isFree: g.isFree ?? undefined,
            price: g.price ?? null,
            genres: g.genres ?? [],
          })),
          aiMessage: t('resultMessage'),
        })
      }

      // Reset and navigate
      onOpenChange(false)
      setTimeout(() => {
        setStep(0)
        setDraft({})
      }, 200)
      router.push(`/${locale}/discover`)
    })
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSkipGenre = () => {
    setDraft({ ...draft, genre: null })
    setStep(step + 1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            {t('badge')} · {step + 1} / {STEPS.length}
          </div>
          <DialogTitle>{t(`steps.${currentStep}.title`)}</DialogTitle>
          <DialogDescription>{t(`steps.${currentStep}.description`)}</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {currentStep === 'mood' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MOODS.map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={draft.mood === m ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDraft({ ...draft, mood: m })}
                >
                  {t(`moods.${m}`)}
                </Button>
              ))}
            </div>
          )}

          {currentStep === 'vibe' && (
            <div className="grid grid-cols-2 gap-2">
              {(['relaxing', 'active'] as Vibe[]).map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant={draft.vibe === v ? 'default' : 'outline'}
                  className="h-auto py-3"
                  onClick={() => setDraft({ ...draft, vibe: v })}
                >
                  {t(`vibe.${v}`)}
                </Button>
              ))}
            </div>
          )}

          {currentStep === 'social' && (
            <div className="grid grid-cols-2 gap-2">
              {(['solo', 'multiplayer'] as Social[]).map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={draft.social === s ? 'default' : 'outline'}
                  className="h-auto py-3"
                  onClick={() => setDraft({ ...draft, social: s })}
                >
                  {t(`social.${s}`)}
                </Button>
              ))}
            </div>
          )}

          {currentStep === 'genre' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GENRES.map((g) => (
                <Button
                  key={g}
                  type="button"
                  variant={draft.genre === g ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDraft({ ...draft, genre: g })}
                >
                  {g}
                </Button>
              ))}
            </div>
          )}

          {currentStep === 'sessionLength' && (
            <div className="grid grid-cols-3 gap-2">
              {(['short', 'medium', 'long'] as SessionLength[]).map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={draft.sessionLength === s ? 'default' : 'outline'}
                  className="h-auto flex-col gap-1 py-3"
                  onClick={() => setDraft({ ...draft, sessionLength: s })}
                >
                  <span>{t(`sessionLength.${s}`)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t(`sessionLengthHint.${s}`)}
                  </span>
                </Button>
              ))}
            </div>
          )}

          {currentStep === 'novelty' && (
            <div className="grid grid-cols-2 gap-2">
              {(['new', 'familiar'] as Novelty[]).map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={draft.novelty === n ? 'default' : 'outline'}
                  className="h-auto py-3"
                  onClick={() => setDraft({ ...draft, novelty: n })}
                >
                  {t(`novelty.${n}`)}
                </Button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={step === 0 || isPending}
          >
            <ArrowLeft className="mr-1 size-4" />
            {t('back')}
          </Button>

          <div className="flex gap-2">
            {currentStep === 'genre' && (
              <Button type="button" variant="ghost" size="sm" onClick={handleSkipGenre}>
                {t('skip')}
              </Button>
            )}
            <Button type="button" onClick={handleNext} disabled={!canProceed || isPending}>
              {isPending ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : step < STEPS.length - 1 ? (
                <ArrowRight className="ml-1 size-4" />
              ) : (
                <Sparkles className="mr-1 size-4" />
              )}
              {step < STEPS.length - 1 ? t('next') : t('finish')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
