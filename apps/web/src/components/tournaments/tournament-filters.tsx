'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

type Status = 'all' | 'live' | 'upcoming' | 'ended'

const STATUSES: Status[] = ['all', 'live', 'upcoming', 'ended']

export function TournamentFilters({ currentStatus }: { currentStatus: Status }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('tournaments')

  const setStatus = (status: Status) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (status === 'all') params.delete('status')
    else params.set('status', status)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((s) => (
        <Button
          key={s}
          variant={currentStatus === s ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatus(s)}
        >
          {t(`filter.${s}`)}
        </Button>
      ))}
    </div>
  )
}
