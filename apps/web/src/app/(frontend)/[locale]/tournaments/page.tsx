import { getTranslations } from 'next-intl/server'
import { listTournaments } from '@/actions/tournaments'
import { TournamentCard } from '@/components/tournaments/tournament-card'
import { TournamentFilters } from '@/components/tournaments/tournament-filters'
import { PageTransition } from '@/components/layout/page-transition'

export const dynamic = 'force-dynamic'

type Status = 'live' | 'upcoming' | 'ended'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function TournamentsPage({ searchParams }: Props) {
  const sp = await searchParams
  const t = await getTranslations('tournaments')

  const rawStatus = sp.status
  const status: Status | undefined =
    rawStatus === 'live' || rawStatus === 'upcoming' || rawStatus === 'ended'
      ? rawStatus
      : undefined

  const tournaments = await listTournaments({ status })

  // Group by status when no filter is applied, so live/upcoming bubble up.
  const live = tournaments.filter((x) => x.status === 'live')
  const upcoming = tournaments.filter((x) => x.status === 'upcoming')
  const ended = tournaments.filter((x) => x.status === 'ended')

  return (
    <PageTransition className="container py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <TournamentFilters currentStatus={status ?? 'all'} />
      </div>

      {tournaments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          {t('empty')}
        </div>
      ) : status ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((x) => (
            <TournamentCard key={x.id} tournament={x} />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {live.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-600" />
                </span>
                {t('section.live')}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {live.map((x) => (
                  <TournamentCard key={x.id} tournament={x} />
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">{t('section.upcoming')}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((x) => (
                  <TournamentCard key={x.id} tournament={x} />
                ))}
              </div>
            </section>
          )}

          {ended.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">{t('section.ended')}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ended.map((x) => (
                  <TournamentCard key={x.id} tournament={x} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageTransition>
  )
}
