import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, tool, convertToModelMessages, stepCountIs, type LanguageModel } from 'ai'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth'
import { ai } from '@/lib/tracked-ai'
import {
  getSystemPrompt,
  searchGamesToolSchema,
  navigateToolSchema,
  openGameToolSchema,
  getUserLibraryToolSchema,
} from '@steam-diploma/ai'

export const maxDuration = 30

// --- Providers ---
const openrouterKey = process.env.OPENROUTER_API_KEY

const geminiKeys = (
  process.env.GOOGLE_GENERATIVE_AI_API_KEYS ??
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
  ''
).split(',').filter(Boolean)
let geminiKeyIndex = 0

function getOpenRouterModel(): LanguageModel | null {
  if (!openrouterKey) return null
  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: openrouterKey,
    headers: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? '',
      'X-Title': 'Steam Diploma',
    },
  })
  return openrouter.chat('openai/gpt-4o-mini')
}

function getGeminiModel(): LanguageModel | null {
  if (geminiKeys.length === 0) return null
  const key = geminiKeys[geminiKeyIndex % geminiKeys.length]
  geminiKeyIndex = (geminiKeyIndex + 1) % geminiKeys.length
  const google = createGoogleGenerativeAI({ apiKey: key })
  return google('gemini-2.0-flash')
}

// --- Rate limiter (per user, in-memory) ---
const requestCounts = new Map<string, { count: number; resetAt: number }>()
const MAX_REQUESTS_PER_MINUTE = 10

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = requestCounts.get(userId)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) return false
  entry.count++
  return true
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!checkRateLimit(session.user.id)) {
    return new Response('Too many requests', { status: 429 })
  }

  const payload = await getPayload({ config })

  // Only verified users can use AI
  const user = await payload.findByID({ collection: 'users', id: session.user.id })
  if (!user?.isVerified) {
    return new Response('Account not verified', { status: 403 })
  }

  const { messages: uiMessages } = await req.json()
  const messages = await convertToModelMessages(uiMessages)

  const systemPrompt = await getSystemPrompt()

  // User context
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

  const systemMessage = `${systemPrompt}

User's favorite games: ${favorites.length > 0 ? favorites.join(', ') : 'none yet'}
User's library (purchased): ${library.length > 0 ? library.join(', ') : 'none yet'}`

  // Pick model: OpenRouter (paid) → Gemini (free fallback)
  const model = getOpenRouterModel() ?? getGeminiModel()
  if (!model) {
    return new Response('No AI providers configured', { status: 503 })
  }

  const isPaid = !!openrouterKey
  const modelId = isPaid ? 'openai/gpt-4o-mini' : 'gemini-2.0-flash'
  console.log('[AI] Provider:', isPaid ? 'OpenRouter (gpt-4o-mini)' : 'Gemini (fallback)')

  const trackingCtx = {
    userId: session.user.id,
    operationType: 'chat',
    endpoint: '/api/chat',
    user: {
      email: session.user.email ?? undefined,
      name: session.user.name ?? undefined,
    },
  }

  const result = streamText({
    model,
    system: systemMessage,
    messages,
    maxRetries: isPaid ? 0 : 2,
    maxOutputTokens: 1024,
    stopWhen: stepCountIs(3),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFinish: ai.onStreamFinish(modelId, trackingCtx) as any,
    tools: {
      search_games: tool({
        ...searchGamesToolSchema,
        execute: async (params) => {
          console.log('[AI tool] search_games:', JSON.stringify(params))
          const where: Record<string, any> = {}
          if (params.query) where.name = { contains: params.query }
          if (params.genre) where['genres.description'] = { contains: params.genre }
          if (params.is_free !== undefined) where.isFree = { equals: params.is_free }
          if (params.platform) where[`platforms.${params.platform}`] = { equals: true }

          const result = await payload.find({
            collection: 'games',
            where,
            locale: 'en',
            limit: params.limit ?? 6,
            sort: '-recommendations.total',
          })

          console.log('[AI tool] search_games found:', result.docs.length)
          return result.docs.map((g) => ({
            appid: g.appid,
            name: g.name,
            headerImage: g.headerImage,
            isFree: g.isFree,
            price: g.price,
            genres: g.genres?.map((gen: any) => gen.description),
          }))
        },
      }),

      navigate: tool({
        ...navigateToolSchema,
        execute: async (params) => {
          console.log('[AI tool] navigate:', JSON.stringify(params))
          return { action: 'navigate', params }
        },
      }),

      open_game: tool({
        ...openGameToolSchema,
        execute: async (params) => {
          console.log('[AI tool] open_game:', JSON.stringify(params))
          let appid = params.appid
          if (!appid) {
            // Search by name across both locales
            const found = await payload.find({
              collection: 'games',
              where: { name: { contains: params.game_name } },
              locale: 'en',
              limit: 1,
            })
            if (found.docs[0]) {
              appid = found.docs[0].appid
            } else {
              // Fallback: try Ukrainian locale
              const foundUk = await payload.find({
                collection: 'games',
                where: { name: { contains: params.game_name } },
                locale: 'uk',
                limit: 1,
              })
              if (foundUk.docs[0]) {
                appid = foundUk.docs[0].appid
              }
            }
          }
          console.log('[AI tool] open_game resolved appid:', appid)
          return { action: 'open_game', appid, gameName: params.game_name }
        },
      }),

      get_user_library: tool({
        ...getUserLibraryToolSchema,
        execute: async (params) => {
          console.log('[AI tool] get_user_library:', JSON.stringify(params))
          const collection =
            params.type === 'library' ? 'purchases' :
            params.type === 'favorites' ? 'favorites' : 'wishlist'

          const result = await payload.find({
            collection,
            where: { user: { equals: session.user!.id! } },
            locale: 'en',
            depth: 1,
            limit: 50,
          })

          return result.docs
            .map((d) => {
              const game = typeof d.game === 'object' && d.game ? d.game : null
              return game ? { appid: game.appid, name: game.name } : null
            })
            .filter(Boolean)
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
