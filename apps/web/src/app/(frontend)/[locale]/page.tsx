import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { GameGrid } from '@/components/games/game-grid'
import { PageTransition } from '@/components/layout/page-transition'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('home')

  const payload = await getPayload({ config })

  const popular = await payload.find({
    collection: 'games',
    where: { detailsFetched: { equals: true } },
    sort: '-recommendations.total',
    locale: locale as 'en' | 'uk',
    limit: 8,
  })

  const recent = await payload.find({
    collection: 'games',
    where: { detailsFetched: { equals: true } },
    sort: '-createdAt',
    locale: locale as 'en' | 'uk',
    limit: 8,
  })

  return (
    <PageTransition className="container space-y-12 py-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t('hero')}</p>
      </section>

      {popular.docs.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Popular Games</h2>
          <GameGrid games={popular.docs as any} />
        </section>
      )}

      {recent.docs.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Recently Added</h2>
          <GameGrid games={recent.docs as any} />
        </section>
      )}
    </PageTransition>
  )
}
