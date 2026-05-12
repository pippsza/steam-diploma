import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, Trophy, Users, MapPin } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getSteamHeaderImage } from '@/lib/steam'
import type { TournamentListItem } from '@/actions/tournaments'

interface Props {
  tournament: TournamentListItem
}

const STATUS_STYLES: Record<TournamentListItem['status'], string> = {
  live: 'bg-red-600 text-white animate-pulse',
  upcoming: 'bg-blue-600 text-white',
  ended: 'bg-gray-600 text-white',
}

export function TournamentCard({ tournament }: Props) {
  const locale = useLocale()
  const t = useTranslations('tournaments')

  const cover =
    tournament.banner ||
    tournament.logo ||
    (tournament.game ? getSteamHeaderImage(tournament.game.appid) : null)

  const date = new Date(tournament.startsAt)
  const dateStr = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const prize =
    tournament.prizePool && tournament.prizePool > 0
      ? `$${tournament.prizePool.toLocaleString()}`
      : null

  return (
    <Link href={`/${locale}/tournaments/${tournament.id}`} className="block h-full">
      <Card className="group flex h-full flex-col overflow-hidden transition-all hover:shadow-lg hover:scale-[1.01]">
        <div className="relative aspect-[460/215] overflow-hidden bg-muted">
          {cover && (
            <Image
              src={cover}
              alt={tournament.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
          <Badge className={`absolute top-2 right-2 ${STATUS_STYLES[tournament.status]}`}>
            {t(`status.${tournament.status}`)}
          </Badge>
          {tournament.game && (
            <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
              {tournament.game.name}
            </span>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col space-y-2 p-3">
          <h3 className="line-clamp-1 font-semibold">{tournament.name}</h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              {dateStr}
            </span>
            {prize && (
              <span className="inline-flex items-center gap-1 font-medium text-amber-500">
                <Trophy className="size-3" />
                {prize}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" />
              {tournament.participantsCount}
              {tournament.maxParticipants ? ` / ${tournament.maxParticipants}` : ''}
            </span>
            {tournament.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {tournament.location}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
