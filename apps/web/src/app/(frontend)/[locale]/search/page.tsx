import { searchGames } from '@/actions/games'
import { GameGrid } from '@/components/games/game-grid'
import { SearchFilters } from '@/components/search/search-filters'

interface Props {
  searchParams: Promise<{
    q?: string
    genre?: string
    free?: string
    platform?: string
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params.q ?? ''
  const genre = params.genre
  const isFree = params.free === 'true' ? true : undefined
  const platform = params.platform as 'windows' | 'mac' | 'linux' | undefined
  const page = parseInt(params.page ?? '1', 10)

  const result = await searchGames(query, { genre, isFree, platform, page, limit: 20 })

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Search Games</h1>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <SearchFilters
            currentQuery={query}
            currentGenre={genre}
            currentFree={params.free}
            currentPlatform={platform}
          />
        </aside>
        <div className="flex-1">
          <p className="mb-4 text-sm text-muted-foreground">
            {result.totalDocs} games found
            {query && <> for &quot;{query}&quot;</>}
          </p>
          <GameGrid games={result.games} />
        </div>
      </div>
    </div>
  )
}
