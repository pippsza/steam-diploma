'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth'

export interface TournamentGame {
  id: string
  appid: number
  name: string
  headerImage?: string | null
}

export interface TournamentListItem {
  id: string
  name: string
  game?: TournamentGame | null
  logo?: string | null
  banner?: string | null
  startsAt: string
  endsAt?: string | null
  prizePool?: number | null
  status: 'upcoming' | 'live' | 'ended'
  format?: string | null
  location?: string | null
  organizer?: string | null
  participantsCount: number
  maxParticipants?: number | null
}

export interface ParticipantItem {
  id: string
  displayName: string
  avatar?: string | null
  team?: string | null
  seed?: number | null
  placement?: number | null
  isMock: boolean
  userId?: string | null
}

export interface TournamentDetail extends TournamentListItem {
  description?: string | null
  signupUrl?: string | null
  participants: ParticipantItem[]
  isJoined: boolean
}

function toGameSummary(raw: unknown): TournamentGame | null {
  if (!raw || typeof raw !== 'object') return null
  const g = raw as { id?: unknown; appid?: number; name?: string; headerImage?: string | null }
  if (!g.id || !g.appid || !g.name) return null
  return {
    id: String(g.id),
    appid: g.appid,
    name: g.name,
    headerImage: g.headerImage ?? null,
  }
}

export async function listTournaments(filter?: {
  status?: 'upcoming' | 'live' | 'ended'
  gameId?: string
  limit?: number
}): Promise<TournamentListItem[]> {
  const payload = await getPayload({ config })

  const where: Record<string, unknown> = {}
  if (filter?.status) where.status = { equals: filter.status }
  if (filter?.gameId) where.game = { equals: filter.gameId }

  const result = await payload.find({
    collection: 'tournaments',
    where: where as never,
    depth: 1,
    limit: filter?.limit ?? 100,
    sort: 'startsAt',
  })

  const ids = result.docs.map((t) => t.id)
  const counts = new Map<string, number>()
  if (ids.length > 0) {
    const parts = await payload.find({
      collection: 'tournament-participants',
      where: { tournament: { in: ids } } as never,
      depth: 0,
      limit: 10000,
      select: { tournament: true },
    })
    for (const p of parts.docs) {
      const t = (p as { tournament?: unknown }).tournament
      const tid = typeof t === 'string' ? t : t ? String((t as { id?: unknown }).id ?? '') : ''
      if (tid) counts.set(tid, (counts.get(tid) ?? 0) + 1)
    }
  }

  return result.docs.map((t) => ({
    id: String(t.id),
    name: t.name,
    game: toGameSummary(t.game),
    logo: t.logo ?? null,
    banner: t.banner ?? null,
    startsAt: String(t.startsAt),
    endsAt: t.endsAt ? String(t.endsAt) : null,
    prizePool: t.prizePool ?? null,
    status: t.status as TournamentListItem['status'],
    format: t.format ?? null,
    location: t.location ?? null,
    organizer: t.organizer ?? null,
    participantsCount: counts.get(String(t.id)) ?? 0,
    maxParticipants: t.maxParticipants ?? null,
  }))
}

export async function getTournament(id: string): Promise<TournamentDetail | null> {
  const payload = await getPayload({ config })

  let doc
  try {
    doc = await payload.findByID({
      collection: 'tournaments',
      id,
      depth: 1,
    })
  } catch {
    return null
  }
  if (!doc) return null

  const parts = await payload.find({
    collection: 'tournament-participants',
    where: { tournament: { equals: id } },
    depth: 0,
    limit: 200,
    sort: 'seed',
  })

  const session = await auth()
  const currentUserId = session?.user?.id ? String(session.user.id) : null

  const participants: ParticipantItem[] = parts.docs.map((p) => {
    const userRel = (p as { user?: unknown }).user
    const userId = typeof userRel === 'string' ? userRel : userRel ? String((userRel as { id?: unknown }).id ?? '') : null
    return {
      id: String(p.id),
      displayName: p.displayName ?? 'Player',
      avatar: p.avatar ?? null,
      team: p.team ?? null,
      seed: p.seed ?? null,
      placement: p.placement ?? null,
      isMock: !!p.isMock,
      userId,
    }
  })

  const isJoined =
    !!currentUserId && participants.some((p) => p.userId === currentUserId)

  return {
    id: String(doc.id),
    name: doc.name,
    game: toGameSummary(doc.game),
    logo: doc.logo ?? null,
    banner: doc.banner ?? null,
    description: doc.description ?? null,
    signupUrl: doc.signupUrl ?? null,
    startsAt: String(doc.startsAt),
    endsAt: doc.endsAt ? String(doc.endsAt) : null,
    prizePool: doc.prizePool ?? null,
    status: doc.status as TournamentListItem['status'],
    format: doc.format ?? null,
    location: doc.location ?? null,
    organizer: doc.organizer ?? null,
    maxParticipants: doc.maxParticipants ?? null,
    participantsCount: participants.length,
    participants,
    isJoined,
  }
}

export async function joinTournament(tournamentId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Not authenticated' }
  }
  const userId = String(session.user.id)
  const payload = await getPayload({ config })

  let doc
  try {
    doc = await payload.findByID({ collection: 'tournaments', id: tournamentId })
  } catch {
    return { success: false as const, error: 'Tournament not found' }
  }
  if (!doc) return { success: false as const, error: 'Tournament not found' }
  if (doc.status === 'ended') {
    return { success: false as const, error: 'Tournament already ended' }
  }

  const existing = await payload.find({
    collection: 'tournament-participants',
    where: { tournament: { equals: tournamentId }, user: { equals: userId } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    return { success: false as const, error: 'Already joined' }
  }

  const count = await payload.count({
    collection: 'tournament-participants',
    where: { tournament: { equals: tournamentId } },
  })
  if (doc.maxParticipants && count.totalDocs >= doc.maxParticipants) {
    return { success: false as const, error: 'Tournament is full' }
  }

  const displayName = session.user.name?.trim() || session.user.email?.split('@')[0] || 'Player'

  await payload.create({
    collection: 'tournament-participants',
    data: {
      tournament: tournamentId,
      user: userId,
      displayName,
      avatar: session.user.image ?? undefined,
      seed: count.totalDocs + 1,
      isMock: false,
    },
  })

  revalidatePath(`/[locale]/tournaments/${tournamentId}`, 'page')
  revalidatePath('/[locale]/tournaments', 'page')
  return { success: true as const }
}

export async function leaveTournament(tournamentId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Not authenticated' }
  }
  const userId = String(session.user.id)
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'tournament-participants',
    where: { tournament: { equals: tournamentId }, user: { equals: userId } },
    limit: 1,
  })
  if (existing.docs[0]) {
    await payload.delete({
      collection: 'tournament-participants',
      id: existing.docs[0].id,
    })
  }

  revalidatePath(`/[locale]/tournaments/${tournamentId}`, 'page')
  revalidatePath('/[locale]/tournaments', 'page')
  return { success: true as const }
}
