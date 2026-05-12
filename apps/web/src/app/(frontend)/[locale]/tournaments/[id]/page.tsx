import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { CalendarDays, MapPin, Trophy, Users, Building2, Trophy as TrophyIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getTournament } from '@/actions/tournaments'
import { JoinButton } from '@/components/tournaments/join-button'
import { PageTransition } from '@/components/layout/page-transition'
import { getSteamHeaderImage } from '@/lib/steam'

interface Props {
  params: Promise<{ id: string; locale: string }>
}

const STATUS_STYLES: Record<'upcoming' | 'live' | 'ended', string> = {
  live: 'bg-red-600 text-white animate-pulse',
  upcoming: 'bg-blue-600 text-white',
  ended: 'bg-gray-600 text-white',
}

export default async function TournamentDetailPage({ params }: Props) {
  const { id, locale } = await params
  const t = await getTranslations('tournaments')
  const tournament = await getTournament(id)
  if (!tournament) notFound()

  const cover =
    tournament.banner ||
    tournament.logo ||
    (tournament.game ? getSteamHeaderImage(tournament.game.appid) : null)

  const dateOpts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  const startsStr = new Date(tournament.startsAt).toLocaleString(locale, dateOpts)
  const endsStr = tournament.endsAt ? new Date(tournament.endsAt).toLocaleString(locale, dateOpts) : null
  const prizeStr =
    tournament.prizePool && tournament.prizePool > 0
      ? `$${tournament.prizePool.toLocaleString()}`
      : null

  const isFull = !!(tournament.maxParticipants && tournament.participantsCount >= tournament.maxParticipants)
  const isEnded = tournament.status === 'ended'

  // Sort participants — placement asc when ended, seed asc otherwise.
  const sortedParticipants = [...tournament.participants].sort((a, b) => {
    if (isEnded) {
      const pa = a.placement ?? Infinity
      const pb = b.placement ?? Infinity
      return pa - pb
    }
    return (a.seed ?? Infinity) - (b.seed ?? Infinity)
  })

  return (
    <PageTransition className="container max-w-5xl py-8">
      <div className="relative aspect-[1200/400] w-full overflow-hidden rounded-xl bg-muted">
        {cover && (
          <Image src={cover} alt={tournament.name} fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className={STATUS_STYLES[tournament.status]}>
              {t(`status.${tournament.status}`)}
            </Badge>
            {tournament.game && (
              <Link href={`/${locale}/games/${tournament.game.appid}`}>
                <Badge variant="secondary" className="hover:bg-accent">
                  {tournament.game.name}
                </Badge>
              </Link>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{tournament.name}</h1>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          {tournament.description && (
            <p className="font-(family-name:--font-inter) text-base leading-[1.7] text-muted-foreground">
              {tournament.description}
            </p>
          )}

          <Separator />

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Users className="size-5" />
              {t('participants')} ({tournament.participants.length}
              {tournament.maxParticipants ? ` / ${tournament.maxParticipants}` : ''})
            </h2>

            {tournament.participants.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noParticipants')}</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sortedParticipants.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 rounded-md border bg-card p-3 ${
                      p.placement === 1 ? 'border-amber-500/50' : ''
                    }`}
                  >
                    {isEnded && p.placement ? (
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          p.placement === 1
                            ? 'bg-amber-500/20 text-amber-400'
                            : p.placement === 2
                              ? 'bg-zinc-400/20 text-zinc-300'
                              : p.placement === 3
                                ? 'bg-orange-700/20 text-orange-400'
                                : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {p.placement}
                      </span>
                    ) : p.seed ? (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                        #{p.seed}
                      </span>
                    ) : null}
                    <Avatar className="size-9 shrink-0">
                      {p.avatar && <AvatarImage src={p.avatar} alt={p.displayName} />}
                      <AvatarFallback>{p.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">
                        {p.displayName}
                        {!p.isMock && (
                          <span className="ml-1 text-xs text-blue-400">★</span>
                        )}
                      </p>
                      {p.team && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">{p.team}</p>
                      )}
                    </div>
                    {isEnded && p.placement === 1 && (
                      <TrophyIcon className="size-4 text-amber-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="w-full space-y-4 lg:w-72 lg:shrink-0">
          <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
            <div className="flex items-start gap-2">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('starts')}</p>
                <p className="text-muted-foreground">{startsStr}</p>
              </div>
            </div>
            {endsStr && (
              <div className="flex items-start gap-2">
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t('ends')}</p>
                  <p className="text-muted-foreground">{endsStr}</p>
                </div>
              </div>
            )}
            {prizeStr && (
              <div className="flex items-start gap-2">
                <Trophy className="size-4 shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium">{t('prizePool')}</p>
                  <p className="text-amber-500">{prizeStr}</p>
                </div>
              </div>
            )}
            {tournament.location && (
              <div className="flex items-start gap-2">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t('location')}</p>
                  <p className="text-muted-foreground">{tournament.location}</p>
                </div>
              </div>
            )}
            {tournament.organizer && (
              <div className="flex items-start gap-2">
                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t('organizer')}</p>
                  <p className="text-muted-foreground">{tournament.organizer}</p>
                </div>
              </div>
            )}
            {tournament.format && (
              <div className="flex items-start gap-2">
                <Users className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t('format')}</p>
                  <p className="text-muted-foreground capitalize">
                    {tournament.format.replace('-', ' ')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <JoinButton
            tournamentId={tournament.id}
            isJoined={tournament.isJoined}
            isFull={isFull}
            isEnded={isEnded}
          />
        </aside>
      </div>
    </PageTransition>
  )
}
