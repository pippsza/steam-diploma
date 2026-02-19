import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { GameGrid } from '@/components/games/game-grid'

export default async function RecommendationsPage() {
  const t = await getTranslations('recommendations')
  const payload = await getPayload({ config })

  const popular = await payload.find({
    collection: 'games',
    where: { detailsFetched: { equals: true } },
    sort: '-recommendations.total',
    limit: 8,
  })

  const topRated = await payload.find({
    collection: 'games',
    where: {
      detailsFetched: { equals: true },
      'metacritic.score': { greater_than: 0 },
    },
    sort: '-metacritic.score',
    limit: 8,
  })

  return (
    <div className="container space-y-12 py-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <section>
        <h2 className="mb-4 text-xl font-semibold">{t('popular')}</h2>
        <GameGrid games={popular.docs} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">{t('topRated')}</h2>
        <GameGrid games={topRated.docs} />
      </section>
    </div>
  )
}
