import { GameCard } from './game-card'

interface Game {
  appid: number
  name: string
  headerImage?: string | null
  isFree?: boolean | null
  price?: {
    currency?: string | null
    final?: number | null
    discountPercent?: number | null
  } | null
  genres?: Array<{ description?: string | null }> | null
}

interface GameGridProps {
  games: Game[]
}

export function GameGrid({ games }: GameGridProps) {
  if (games.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No games found
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {games.map((game) => (
        <GameCard
          key={game.appid}
          appid={game.appid}
          name={game.name}
          headerImage={game.headerImage}
          isFree={game.isFree ?? false}
          price={game.price}
          genres={game.genres}
        />
      ))}
    </div>
  )
}
