import { GameCard } from './game-card'

interface Game {
  id?: string | number
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
  ownedIds?: string[]
  markAllOwned?: boolean
}

export function GameGrid({ games, ownedIds, markAllOwned }: GameGridProps) {
  if (games.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No games found
      </div>
    )
  }

  const ownedSet = ownedIds ? new Set(ownedIds) : null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {games.map((game) => (
        <GameCard
          key={game.appid}
          appid={game.appid}
          name={game.name}
          headerImage={game.headerImage}
          isFree={game.isFree ?? false}
          isOwned={markAllOwned || (ownedSet ? ownedSet.has(String(game.id)) : false)}
          price={game.price}
          genres={game.genres}
        />
      ))}
    </div>
  )
}
