import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { fetchSteamAppDetails } from '../lib/steam'
import type { SteamAppDetails } from '../lib/steam'

const STEAMSPY_API = 'https://steamspy.com/api.php'
const TOP_GAMES_COUNT = 5000
const DELAY_MS = 1500 // Rate limit: ~40 req/min
const BATCH_LOG_INTERVAL = 50

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchTopAppIds(): Promise<number[]> {
  console.log('Fetching top games from SteamSpy...')
  const res = await fetch(`${STEAMSPY_API}?request=all`)
  const data = await res.json()

  const sorted = Object.entries(data)
    .map(([, v]) => v as { appid: number; owners: string })
    .sort((a, b) => {
      const parseOwners = (s: string) => parseInt(s.replace(/,/g, '').split(' ')[0]) || 0
      return parseOwners(b.owners) - parseOwners(a.owners)
    })
    .slice(0, TOP_GAMES_COUNT)

  console.log(`Got ${sorted.length} top game IDs`)
  return sorted.map((g) => g.appid)
}

function mapDetailsToPayload(details: SteamAppDetails) {
  return {
    appid: details.steam_appid,
    name: details.name,
    type: details.type === 'game' ? 'game' : details.type === 'dlc' ? 'dlc' : details.type === 'demo' ? 'demo' : 'other',
    headerImage: details.header_image,
    shortDescription: details.short_description,
    isFree: details.is_free,
    genres: details.genres?.map((g) => ({ genreId: g.id, description: g.description })) ?? [],
    categories: details.categories?.map((c) => ({ categoryId: String(c.id), description: c.description })) ?? [],
    screenshots: details.screenshots?.map((s) => ({ url: s.path_full, thumbnailUrl: s.path_thumbnail })) ?? [],
    releaseDate: details.release_date?.date ?? '',
    price: details.price_overview
      ? {
          currency: details.price_overview.currency,
          initial: details.price_overview.initial,
          final: details.price_overview.final,
          discountPercent: details.price_overview.discount_percent,
        }
      : undefined,
    developers: details.developers?.map((name) => ({ name })) ?? [],
    publishers: details.publishers?.map((name) => ({ name })) ?? [],
    platforms: details.platforms ?? { windows: false, mac: false, linux: false },
    metacritic: details.metacritic ? { score: details.metacritic.score, url: details.metacritic.url } : undefined,
    recommendations: details.recommendations ? { total: details.recommendations.total } : undefined,
    detailsFetched: true,
    detailsFetchedAt: new Date().toISOString(),
  }
}

async function main() {
  console.log('Starting seed...')
  const payload = await getPayload({ config })

  const appids = await fetchTopAppIds()

  // Check which games already exist
  const existing = await payload.find({
    collection: 'games',
    where: { detailsFetched: { equals: true } },
    limit: 0,
  })
  const existingIds = new Set(
    (
      await payload.find({
        collection: 'games',
        where: { detailsFetched: { equals: true } },
        limit: 100000,
        select: { appid: true },
      })
    ).docs.map((d) => d.appid),
  )

  const toFetch = appids.filter((id) => !existingIds.has(id))
  console.log(`${existingIds.size} already seeded, ${toFetch.length} to fetch`)

  let success = 0
  let failed = 0

  for (let i = 0; i < toFetch.length; i++) {
    const appid = toFetch[i]

    try {
      const details = await fetchSteamAppDetails(appid)

      if (details && details.type === 'game') {
        const gameData = mapDetailsToPayload(details)
        await payload.create({ collection: 'games', data: gameData as never })
        success++
      } else {
        failed++
      }
    } catch (err) {
      failed++
      console.error(`Error seeding ${appid}:`, err)
    }

    if ((i + 1) % BATCH_LOG_INTERVAL === 0) {
      console.log(`Progress: ${i + 1}/${toFetch.length} | Success: ${success} | Failed: ${failed}`)
    }

    if (i + 1 < toFetch.length) {
      await delay(DELAY_MS)
    }
  }

  console.log(`\nSeed complete! Success: ${success}, Failed: ${failed}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
