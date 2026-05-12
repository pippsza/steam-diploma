'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { signIn, useSession } from 'next-auth/react'
import { Check, LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { joinTournament, leaveTournament } from '@/actions/tournaments'

interface Props {
  tournamentId: string
  isJoined: boolean
  isFull: boolean
  isEnded: boolean
}

export function JoinButton({ tournamentId, isJoined, isFull, isEnded }: Props) {
  const t = useTranslations('tournaments')
  const router = useRouter()
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()

  if (!session?.user) {
    return (
      <Button onClick={() => signIn('google')}>
        <LogIn className="mr-2 size-4" />
        {t('signInToJoin')}
      </Button>
    )
  }

  if (isEnded) {
    return (
      <Button variant="secondary" disabled>
        {t('alreadyEnded')}
      </Button>
    )
  }

  if (isJoined) {
    return (
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await leaveTournament(tournamentId)
            router.refresh()
          })
        }
      >
        <LogOut className="mr-2 size-4" />
        {t('leave')}
      </Button>
    )
  }

  if (isFull) {
    return (
      <Button variant="secondary" disabled>
        {t('full')}
      </Button>
    )
  }

  return (
    <Button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await joinTournament(tournamentId)
          router.refresh()
        })
      }
    >
      <Check className="mr-2 size-4" />
      {t('join')}
    </Button>
  )
}
