import { getTranslations } from 'next-intl/server'
import { getFavorites } from '@/actions/favorites'
import { GameGrid } from '@/components/games/game-grid'

export default async function FavoritesPage() {
  const t = await getTranslations('common')

  let games: Array<{
    appid: number
    name: string
    headerImage?: string | null
    isFree?: boolean | null
    price?: { currency?: string | null; final?: number | null; discountPercent?: number | null } | null
    genres?: Array<{ description?: string | null }> | null
  }> = []

  try {
    const favorites = await getFavorites()
    games = favorites
      .map((f) => (typeof f.game === 'object' && f.game ? f.game : null))
      .filter(Boolean) as typeof games
  } catch {
    // Not authenticated
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('favorites')}</h1>
      <GameGrid games={games} />
    </div>
  )
}
