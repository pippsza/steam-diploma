import { google } from '@ai-sdk/google'
import { streamText, tool } from 'ai'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth'
import {
  getModelConfig,
  getSystemPrompt,
  searchGamesToolSchema,
  navigateToolSchema,
  openGameToolSchema,
  getUserLibraryToolSchema,
} from '@steam-diploma/ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages } = await req.json()
  const payload = await getPayload({ config })

  // Get AI config
  const modelConfig = await getModelConfig()
  const systemPrompt = await getSystemPrompt()

  // Get user context for the system prompt
  const [favorites, library] = await Promise.all([
    payload
      .find({
        collection: 'favorites',
        where: { user: { equals: session.user.id } },
        depth: 1,
        limit: 20,
      })
      .then((r) =>
        r.docs.map((d) => (typeof d.game === 'object' && d.game ? d.game.name : '')).filter(Boolean),
      ),
    payload
      .find({
        collection: 'purchases',
        where: { user: { equals: session.user.id } },
        depth: 1,
        limit: 20,
      })
      .then((r) =>
        r.docs.map((d) => (typeof d.game === 'object' && d.game ? d.game.name : '')).filter(Boolean),
      ),
  ])

  const userContext = `
User's favorite games: ${favorites.length > 0 ? favorites.join(', ') : 'none yet'}
User's library (purchased): ${library.length > 0 ? library.join(', ') : 'none yet'}`

  const result = streamText({
    model: google(modelConfig.modelId),
    system: `${systemPrompt}\n\n${userContext}`,
    messages,
    tools: {
      search_games: tool({
        ...searchGamesToolSchema,
        execute: async (params) => {
          const where: Record<string, unknown> = {}
          if (params.query) where.name = { contains: params.query }
          if (params.genre) where['genres.description'] = { contains: params.genre }
          if (params.isFree !== undefined) where.isFree = { equals: params.isFree }
          if (params.platform) where[`platforms.${params.platform}`] = { equals: true }

          const result = await payload.find({
            collection: 'games',
            where,
            limit: params.limit ?? 6,
            sort: '-recommendations.total',
          })

          return result.docs.map((g) => ({
            appid: g.appid,
            name: g.name,
            headerImage: g.headerImage,
            isFree: g.isFree,
            price: g.price,
            genres: g.genres?.map((gen) => gen.description),
          }))
        },
      }),

      navigate: tool({
        ...navigateToolSchema,
        execute: async (params) => {
          return { action: 'navigate', params }
        },
      }),

      open_game: tool({
        ...openGameToolSchema,
        execute: async (params) => {
          return { action: 'open_game', appid: params.appid, gameName: params.gameName }
        },
      }),

      get_user_library: tool({
        ...getUserLibraryToolSchema,
        execute: async (params) => {
          const collection = params.type === 'library' ? 'purchases' : params.type === 'favorites' ? 'favorites' : 'wishlist'

          const result = await payload.find({
            collection,
            where: { user: { equals: session.user!.id! } },
            depth: 1,
            limit: 50,
          })

          return result.docs.map((d) => {
            const game = typeof d.game === 'object' && d.game ? d.game : null
            return game ? { appid: game.appid, name: game.name } : null
          }).filter(Boolean)
        },
      }),
    },
  })

  return result.toDataStreamResponse()
}
