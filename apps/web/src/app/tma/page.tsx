import { getPayload } from 'payload'
import config from '@payload-config'
import { TMAHome } from './tma-home'

export default async function TMAHomePage() {
  const payload = await getPayload({ config })

  const popular = await payload.find({
    collection: 'games',
    limit: 10,
    sort: '-recommendations.total',
    where: { detailsFetched: { equals: true } },
  })

  return <TMAHome games={popular.docs as any} />
}
