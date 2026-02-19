import { getTranslations } from 'next-intl/server'
import { getLibrary } from '@/actions/purchases'
import { GameGrid } from '@/components/games/game-grid'

export default async function LibraryPage() {
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
    const purchases = await getLibrary()
    games = purchases
      .map((p) => (typeof p.game === 'object' && p.game ? p.game : null))
      .filter(Boolean) as typeof games
  } catch {
    // Not authenticated
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('library')}</h1>
      <GameGrid games={games} />
    </div>
  )
}
