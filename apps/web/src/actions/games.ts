'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import {
  fetchSteamAppDetails,
  fetchSteamReviews,
  parseRequirements,
  stripHtml,
} from '@/lib/steam'
import type { SteamAppDetails } from '@/lib/steam'

function mapDetailsToData(details: SteamAppDetails) {
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

export async function getGameByAppId(appid: number, locale: string = 'en') {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'games',
    where: { appid: { equals: appid } },
    locale: locale as 'en' | 'uk',
    limit: 1,
  })

  let game = result.docs[0]

  // Lazy fetch details if not yet fetched
  if (game && !game.detailsFetched) {
    const [detailsEn, detailsUk] = await Promise.all([
      fetchSteamAppDetails(appid, 'english'),
      fetchSteamAppDetails(appid, 'ukrainian'),
    ])

    if (detailsEn) {
      const gameData = mapDetailsToData(detailsEn)

      // Fetch reviews
      const [reviewsEn, reviewsUk] = await Promise.all([
        fetchSteamReviews(appid, 'english', 5),
        fetchSteamReviews(appid, 'ukrainian', 5),
      ])
      const reviews = [
        ...reviewsEn.map((r) => ({
          reviewId: r.recommendationid,
          language: 'english',
          review: r.review,
          votedUp: r.voted_up,
          playtimeForever: r.author.playtime_forever,
          timestampCreated: r.timestamp_created,
          votesUp: r.votes_up,
          votesFunny: r.votes_funny,
        })),
        ...reviewsUk.map((r) => ({
          reviewId: r.recommendationid,
          language: 'ukrainian',
          review: r.review,
          votedUp: r.voted_up,
          playtimeForever: r.author.playtime_forever,
          timestampCreated: r.timestamp_created,
          votesUp: r.votes_up,
          votesFunny: r.votes_funny,
        })),
      ]

      game = await payload.update({
        collection: 'games',
        id: game.id,
        locale: 'en',
        data: { ...gameData, reviews } as never,
      })

      // Save Ukrainian localized fields
      if (detailsUk) {
        await payload.update({
          collection: 'games',
          id: game.id,
          locale: 'uk',
          data: {
            name: detailsUk.name,
            shortDescription: detailsUk.short_description,
            aboutTheGame: detailsUk.about_the_game ? stripHtml(detailsUk.about_the_game) : undefined,
          } as never,
        })
      }

      // Re-fetch with requested locale
      if (locale === 'uk') {
        const refetched = await payload.find({
          collection: 'games',
          where: { appid: { equals: appid } },
          locale: 'uk',
          limit: 1,
        })
        game = refetched.docs[0] ?? game
      }
    }
  }

  // If game doesn't exist at all, try to fetch from Steam and create
  if (!game) {
    const [detailsEn, detailsUk] = await Promise.all([
      fetchSteamAppDetails(appid, 'english'),
      fetchSteamAppDetails(appid, 'ukrainian'),
    ])

    if (detailsEn) {
      const gameData = mapDetailsToData(detailsEn)

      const [reviewsEn, reviewsUk] = await Promise.all([
        fetchSteamReviews(appid, 'english', 5),
        fetchSteamReviews(appid, 'ukrainian', 5),
      ])
      const reviews = [
        ...reviewsEn.map((r) => ({
          reviewId: r.recommendationid,
          language: 'english',
          review: r.review,
          votedUp: r.voted_up,
          playtimeForever: r.author.playtime_forever,
          timestampCreated: r.timestamp_created,
          votesUp: r.votes_up,
          votesFunny: r.votes_funny,
        })),
        ...reviewsUk.map((r) => ({
          reviewId: r.recommendationid,
          language: 'ukrainian',
          review: r.review,
          votedUp: r.voted_up,
          playtimeForever: r.author.playtime_forever,
          timestampCreated: r.timestamp_created,
          votesUp: r.votes_up,
          votesFunny: r.votes_funny,
        })),
      ]

      game = await payload.create({
        collection: 'games',
        locale: 'en',
        data: { ...gameData, reviews } as never,
      })

      if (detailsUk) {
        await payload.update({
          collection: 'games',
          id: game.id,
          locale: 'uk',
          data: {
            name: detailsUk.name,
            shortDescription: detailsUk.short_description,
            aboutTheGame: detailsUk.about_the_game ? stripHtml(detailsUk.about_the_game) : undefined,
          } as never,
        })
      }

      // Re-fetch with requested locale
      if (locale === 'uk') {
        const refetched = await payload.find({
          collection: 'games',
          where: { appid: { equals: appid } },
          locale: 'uk',
          limit: 1,
        })
        game = refetched.docs[0] ?? game
      }
    }
  }

  return game ?? null
}

export async function searchGames(query: string, filters?: {
  genre?: string
  isFree?: boolean
  platform?: 'windows' | 'mac' | 'linux'
  hasRequirements?: boolean
  page?: number
  limit?: number
  locale?: string
}) {
  const payload = await getPayload({ config })
  const locale = (filters?.locale as 'en' | 'uk') ?? 'en'
  const limit = filters?.limit ?? 20
  const page = filters?.page ?? 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (query) {
    where.name = { contains: query }
  }

  if (filters?.genre) {
    where['genres.description'] = { contains: filters.genre }
  }

  if (filters?.isFree !== undefined) {
    where.isFree = { equals: filters.isFree }
  }

  if (filters?.platform) {
    where[`platforms.${filters.platform}`] = { equals: true }
  }

  if (filters?.hasRequirements) {
    where['pcRequirements.minimum'] = { exists: true }
  }

  // Always search with locale 'en' — English names are always populated.
  // Localized name.uk may be null for games without Ukrainian translation on Steam,
  // which causes `contains` to miss them entirely.
  const result = await payload.find({
    collection: 'games',
    where,
    locale: 'en',
    limit,
    page,
    sort: '-recommendations.total',
  })

  // If user's locale differs, re-fetch the same docs for proper display names
  if (locale !== 'en' && result.docs.length > 0) {
    const ids = result.docs.map((d) => d.id)
    const localized = await payload.find({
      collection: 'games',
      where: { id: { in: ids } },
      locale,
      limit: ids.length,
    })
    // Preserve original sort order
    const byId = new Map(localized.docs.map((d) => [d.id, d]))
    const sorted = ids.map((id) => byId.get(id)).filter(Boolean)

    return {
      games: sorted,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
      page: result.page,
    }
  }

  return {
    games: result.docs,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
    page: result.page,
  }
}
