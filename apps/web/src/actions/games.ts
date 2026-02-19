'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { fetchSteamAppDetails } from '@/lib/steam'

export async function getGameByAppId(appid: number) {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'games',
    where: { appid: { equals: appid } },
    limit: 1,
  })

  let game = result.docs[0]

  // Lazy fetch details if not yet fetched
  if (game && !game.detailsFetched) {
    const details = await fetchSteamAppDetails(appid)
    if (details) {
      game = await payload.update({
        collection: 'games',
        id: game.id,
        data: {
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
        },
      })
    }
  }

  // If game doesn't exist at all, try to fetch from Steam and create
  if (!game) {
    const details = await fetchSteamAppDetails(appid)
    if (details) {
      game = await payload.create({
        collection: 'games',
        data: {
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
        } as never,
      })
    }
  }

  return game ?? null
}

export async function searchGames(query: string, filters?: {
  genre?: string
  isFree?: boolean
  platform?: 'windows' | 'mac' | 'linux'
  page?: number
  limit?: number
}) {
  const payload = await getPayload({ config })

  const where: Record<string, unknown> = {}

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

  const result = await payload.find({
    collection: 'games',
    where,
    limit: filters?.limit ?? 20,
    page: filters?.page ?? 1,
    sort: '-recommendations.total',
  })

  return {
    games: result.docs,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
    page: result.page,
  }
}
