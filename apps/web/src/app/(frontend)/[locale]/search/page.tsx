import { searchGames } from '@/actions/games'
import { GameGrid } from '@/components/games/game-grid'
import { PageTransition } from '@/components/layout/page-transition'
import { SearchFilters } from '@/components/search/search-filters'
import { SearchPagination } from '@/components/search/search-pagination'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    q?: string
    genre?: string
    free?: string
    platform?: string
    reqs?: string
    page?: string
  }>
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams
  const query = sp.q ?? ''
  const genre = sp.genre
  const isFree = sp.free === 'true' ? true : undefined
  const platform = sp.platform as 'windows' | 'mac' | 'linux' | undefined
  const hasRequirements = sp.reqs === 'true' ? true : undefined
  const page = parseInt(sp.page ?? '1', 10)

  const result = await searchGames(query, {
    genre,
    isFree,
    platform,
    hasRequirements,
    page,
    limit: 20,
    locale,
  })

  return (
    <PageTransition className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Search Games</h1>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <SearchFilters
            currentQuery={query}
            currentGenre={genre}
            currentFree={sp.free}
            currentPlatform={platform}
            currentHasReqs={sp.reqs}
          />
        </aside>
        <div className="flex-1">
          <p className="mb-4 text-sm text-muted-foreground">
            {result.totalDocs} games found
            {query && <> for &quot;{query}&quot;</>}
          </p>
          <GameGrid games={result.games as any} />
          <SearchPagination
            currentPage={result.page ?? page}
            totalPages={result.totalPages}
          />
        </div>
      </div>
    </PageTransition>
  )
}
