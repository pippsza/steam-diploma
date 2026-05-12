'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth'

export type Mood =
  | 'chill'
  | 'intense'
  | 'competitive'
  | 'adventurous'
  | 'thoughtful'
  | 'creative'
  | 'social'
  | 'nostalgic'
  | 'scary'
  | 'sad'
  | 'happy'
  | 'bored'

export type Vibe = 'relaxing' | 'active'
export type Social = 'solo' | 'multiplayer'
export type SessionLength = 'short' | 'medium' | 'long'
export type Novelty = 'new' | 'familiar'

export interface SurveyAnswers {
  mood: Mood
  vibe: Vibe
  social: Social
  genre?: string | null
  sessionLength: SessionLength
  novelty: Novelty
}

export interface SurveyGame {
  id: string
  appid: number
  name: string
  headerImage?: string | null
  isFree?: boolean | null
  price?: {
    currency?: string | null
    final?: number | null
    discountPercent?: number | null
  } | null
  genres?: string[]
}

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user.id
}

const MOOD_GENRES: Record<Mood, string[]> = {
  chill: ['Casual', 'Simulation'],
  intense: ['Action', 'Racing'],
  competitive: ['Sports', 'Action', 'Massively Multiplayer'],
  adventurous: ['Adventure', 'RPG'],
  thoughtful: ['Strategy'],
  creative: ['Simulation', 'Indie'],
  social: ['Massively Multiplayer', 'Free To Play'],
  nostalgic: ['Indie'],
  scary: [],
  sad: ['Adventure', 'Indie'],
  happy: ['Casual', 'Indie'],
  bored: ['Action', 'Adventure', 'Casual'],
}

const VIBE_GENRES: Record<Vibe, string[]> = {
  relaxing: ['Casual', 'Simulation', 'Adventure', 'Indie'],
  active: ['Action', 'Racing', 'Sports'],
}

export async function saveMoodSurvey(answers: SurveyAnswers) {
  try {
    const userId = await getUserId()
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'mood-surveys',
      data: { user: userId, ...answers },
    })
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Not authenticated' }
  }
}

export async function pickGamesFromSurvey(
  answers: SurveyAnswers,
  limit = 12,
): Promise<SurveyGame[]> {
  const payload = await getPayload({ config })

  // Combine genres from mood + vibe + explicit genre choice.
  const genres = new Set<string>([
    ...MOOD_GENRES[answers.mood],
    ...VIBE_GENRES[answers.vibe],
    ...(answers.genre ? [answers.genre] : []),
  ])

  const where: Record<string, unknown> = {
    detailsFetched: { equals: true },
  }
  const and: Array<Record<string, unknown>> = []

  if (genres.size > 0) {
    and.push({
      or: Array.from(genres).map((g) => ({
        'genres.description': { contains: g },
      })),
    })
  }

  // Social: try to filter by Steam categories (Single-player / Multi-player).
  if (answers.social === 'multiplayer') {
    and.push({
      or: [
        { 'categories.description': { contains: 'Multi-player' } },
        { 'categories.description': { contains: 'Co-op' } },
        { 'categories.description': { contains: 'PvP' } },
      ],
    })
  } else if (answers.social === 'solo') {
    and.push({ 'categories.description': { contains: 'Single-player' } })
  }

  if (and.length > 0) where.and = and

  // Sort: "new" → recent releases, "familiar" → most-recommended classics.
  const sort = answers.novelty === 'new' ? '-createdAt' : '-recommendations.total'

  let result = await payload.find({
    collection: 'games',
    where: where as never,
    locale: 'en',
    limit,
    sort,
  })

  // Fallback for mood without genres (e.g. scary) — keyword search.
  if (result.docs.length === 0 && answers.mood === 'scary') {
    const keywords = ['horror', 'zombie', 'dead', 'dark', 'survival']
    const keyword = keywords[Math.floor(Math.random() * keywords.length)]
    result = await payload.find({
      collection: 'games',
      where: {
        detailsFetched: { equals: true },
        name: { contains: keyword },
      },
      locale: 'en',
      limit,
      sort: '-recommendations.total',
    })
  }

  // Last-resort fallback — relax filters so the user still sees something.
  if (result.docs.length === 0) {
    result = await payload.find({
      collection: 'games',
      where: { detailsFetched: { equals: true } },
      locale: 'en',
      limit,
      sort: '-recommendations.total',
    })
  }

  return result.docs.map((g) => ({
    id: String(g.id),
    appid: g.appid,
    name: g.name,
    headerImage: g.headerImage,
    isFree: g.isFree,
    price: g.price,
    genres:
      (g.genres as Array<{ description?: string | null }> | null | undefined)
        ?.map((gen) => gen.description ?? '')
        .filter(Boolean) ?? [],
  }))
}

export async function getRecentMoodSurveys(limit = 3) {
  try {
    const userId = await getUserId()
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'mood-surveys',
      where: { user: { equals: userId } },
      sort: '-createdAt',
      limit,
    })
    return result.docs.map((d) => ({
      mood: d.mood as Mood,
      vibe: d.vibe as Vibe,
      social: d.social as Social,
      genre: (d.genre as string | null | undefined) ?? null,
      sessionLength: d.sessionLength as SessionLength,
      novelty: d.novelty as Novelty,
      createdAt: d.createdAt as string,
    }))
  } catch {
    return []
  }
}
