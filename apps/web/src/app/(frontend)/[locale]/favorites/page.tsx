import Link from 'next/link'
import { Heart, Search } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { getFavorites } from '@/actions/favorites'
import { GameGrid } from '@/components/games/game-grid'
import { AuthRequired } from '@/components/auth/auth-required'
import { PageTransition } from '@/components/layout/page-transition'

export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('common')
  const tGames = await getTranslations('games')
  const tAuth = await getTranslations('auth')
  const session = await auth()

  if (!session?.user) {
    return (
      <PageTransition className="container py-8">
        <h1 className="mb-6 text-2xl font-bold">{t('favorites')}</h1>
        <AuthRequired message={tAuth('signInRequiredDescription')} />
      </PageTransition>
    )
  }

  let games: Array<{
    appid: number
    name: string
    headerImage?: string | null
    isFree?: boolean | null
    price?: { currency?: string | null; final?: number | null; discountPercent?: number | null } | null
    genres?: Array<{ description?: string | null }> | null
  }> = []

  try {
    const favorites = await getFavorites(locale)
    games = favorites
      .map((f) => (typeof f.game === 'object' && f.game ? f.game : null))
      .filter(Boolean) as typeof games
  } catch {
    // Error fetching favorites
  }

  return (
    <PageTransition className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('favorites')}</h1>
      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
          <Heart className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{tGames('emptyFavorites')}</h3>
            <p className="text-sm text-muted-foreground">{tGames('emptyFavoritesHint')}</p>
          </div>
          <Link
            href={`/${locale}/search`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Search className="h-4 w-4" />
            {tGames('browseGames')}
          </Link>
        </div>
      ) : (
        <GameGrid games={games} />
      )}
    </PageTransition>
  )
}
