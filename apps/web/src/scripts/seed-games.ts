import { getPayload } from 'payload'
import config from '@payload-config'
import {
  fetchSteamAppDetails,
  fetchSteamReviews,
  parseRequirements,
  stripHtml,
} from '../lib/steam'
import type { SteamAppDetails, SteamReview } from '../lib/steam'

const STEAMSPY_API = 'https://steamspy.com/api.php'
const STEAMSPY_PAGES = 5
const DELAY_MS = 1500
const STEAMSPY_DELAY_MS = 2000
const BATCH_LOG_INTERVAL = 50

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchTopAppIds(): Promise<number[]> {
  console.log(`Fetching top games from SteamSpy (${STEAMSPY_PAGES} pages)...`)
  const allGames = new Map<number, number>()

  for (let page = 0; page < STEAMSPY_PAGES; page++) {
    console.log(`  Fetching page ${page}...`)
    try {
      const res = await fetch(`${STEAMSPY_API}?request=all&page=${page}`)
      const data = await res.json()
      const entries = Object.values(data) as Array<{ appid: number; owners: string }>

      if (entries.length === 0) {
        console.log(`  Page ${page} empty, stopping.`)
        break
      }

      for (const entry of entries) {
        const owners = parseInt(entry.owners.replace(/,/g, '').split(' ')[0]) || 0
        allGames.set(entry.appid, owners)
      }

      console.log(`  Page ${page}: ${entries.length} games (total unique: ${allGames.size})`)

      if (page + 1 < STEAMSPY_PAGES) {
        await delay(STEAMSPY_DELAY_MS)
      }
    } catch (err) {
      console.error(`  Error fetching page ${page}:`, err)
    }
  }

  const sorted = [...allGames.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([appid]) => appid)

  console.log(`Got ${sorted.length} unique game IDs`)
  return sorted
}

function mapReviews(reviews: SteamReview[], language: string) {
  return reviews.map((r) => ({
    reviewId: r.recommendationid,
    language,
    review: r.review,
    votedUp: r.voted_up,
    playtimeForever: r.author.playtime_forever,
    timestampCreated: r.timestamp_created,
    votesUp: r.votes_up,
    votesFunny: r.votes_funny,
  }))
}

function mapDetailsToPayload(details: SteamAppDetails) {
  return {
    appid: details.steam_appid,
    name: details.name,
    type: details.type === 'game' ? 'game' : details.type === 'dlc' ? 'dlc' : details.type === 'demo' ? 'demo' : 'other',
    headerImage: details.header_image,
    shortDescription: details.short_description,
    aboutTheGame: details.about_the_game ? stripHtml(details.about_the_game) : undefined,
    supportedLanguages: details.supported_languages ? stripHtml(details.supported_languages) : undefined,
    isFree: details.is_free,
    genres: details.genres?.map((g) => ({ genreId: g.id, description: g.description })) ?? [],
    categories: details.categories?.map((c) => ({ categoryId: String(c.id), description: c.description })) ?? [],
    screenshots: details.screenshots?.map((s) => ({ url: s.path_full, thumbnailUrl: s.path_thumbnail })) ?? [],
    releaseDate: details.release_date?.date ?? '',
    comingSoon: details.release_date?.coming_soon ?? false,
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
    pcRequirements: parseRequirements(details.pc_requirements),
    macRequirements: parseRequirements(details.mac_requirements),
    linuxRequirements: parseRequirements(details.linux_requirements),
    metacritic: details.metacritic ? { score: details.metacritic.score, url: details.metacritic.url } : undefined,
    recommendations: details.recommendations ? { total: details.recommendations.total } : undefined,
    detailsFetched: true,
    detailsFetchedAt: new Date().toISOString(),
  }
}

async function main() {
  console.log('Starting seed (dual-language + reviews)...')
  const payload = await getPayload({ config })

  const appids = await fetchTopAppIds()

  // Check which games already have details fetched (skip those)
  const fetchedIds = new Set(
    (
      await payload.find({
        collection: 'games',
        where: { detailsFetched: { equals: true } },
        limit: 100000,
        locale: 'en',
        select: { appid: true },
      })
    ).docs.map((d) => d.appid),
  )

  const toFetch = appids.filter((id) => !fetchedIds.has(id))
  console.log(`${fetchedIds.size} already seeded, ${toFetch.length} to fetch`)

  let success = 0
  let failed = 0

  for (let i = 0; i < toFetch.length; i++) {
    const appid = toFetch[i]

    try {
      // Fetch EN + UK details in parallel
      const [detailsEn, detailsUk] = await Promise.all([
        fetchSteamAppDetails(appid, 'english'),
        fetchSteamAppDetails(appid, 'ukrainian'),
      ])

      if (!detailsEn || detailsEn.type !== 'game') {
        failed++
        if ((i + 1) % BATCH_LOG_INTERVAL === 0) {
          console.log(`Progress: ${i + 1}/${toFetch.length} | OK: ${success} | Fail: ${failed}`)
        }
        if (i + 1 < toFetch.length) await delay(DELAY_MS)
        continue
      }

      // Fetch reviews EN + UK in parallel
      const [reviewsEn, reviewsUk] = await Promise.all([
        fetchSteamReviews(appid, 'english', 5),
        fetchSteamReviews(appid, 'ukrainian', 5),
      ])

      const gameData = mapDetailsToPayload(detailsEn)
      const allReviews = [
        ...mapReviews(reviewsEn, 'english'),
        ...mapReviews(reviewsUk, 'ukrainian'),
      ]

      // Create or update with EN locale
      let gameId: string | undefined
      try {
        const created = await payload.create({
          collection: 'games',
          locale: 'en',
          data: { ...gameData, reviews: allReviews } as never,
        })
        gameId = String(created.id)
      } catch {
        // Duplicate — update existing
        const existing = await payload.find({
          collection: 'games',
          where: { appid: { equals: appid } },
          locale: 'en',
          limit: 1,
        })
        if (existing.docs.length > 0) {
          gameId = String(existing.docs[0].id)
          await payload.update({
            collection: 'games',
            id: gameId!,
            locale: 'en',
            data: { ...gameData, reviews: allReviews } as never,
          })
        }
      }

      // Update with UK locale (localized fields only)
      if (gameId && detailsUk) {
        await payload.update({
          collection: 'games',
          id: gameId,
          locale: 'uk',
          data: {
            name: detailsUk.name,
            shortDescription: detailsUk.short_description,
            aboutTheGame: detailsUk.about_the_game ? stripHtml(detailsUk.about_the_game) : undefined,
          } as never,
        })
      }

      success++
    } catch (err) {
      failed++
      console.error(`Error seeding ${appid}:`, err)
    }

    if ((i + 1) % BATCH_LOG_INTERVAL === 0) {
      console.log(`Progress: ${i + 1}/${toFetch.length} | OK: ${success} | Fail: ${failed}`)
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
