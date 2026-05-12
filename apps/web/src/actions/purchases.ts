'use server'

import { randomBytes } from 'crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth'
import { getGameAvailability } from '@/lib/game-status'

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user.id
}

// Steam-style key: 3 groups of 5 alphanumeric uppercase chars (e.g. AB12C-DE34F-GH56K)
function generateActivationKey(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(15)
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length])
  return `${chars.slice(0, 5).join('')}-${chars.slice(5, 10).join('')}-${chars.slice(10, 15).join('')}`
}

export async function purchaseGame(gameId: string, _price: number = 0) {
  try {
    const userId = await getUserId()
    const payload = await getPayload({ config })

    // Re-derive availability from the source of truth; never trust the client price.
    const game = await payload.findByID({ collection: 'games', id: gameId, locale: 'en' })
    if (!game) return { success: false, error: 'Game not found' }

    const availability = getGameAvailability({
      isFree: game.isFree,
      comingSoon: game.comingSoon,
      price: game.price,
    })
    if (availability.kind === 'comingSoon') {
      return { success: false, error: 'Game has not been released yet' }
    }
    if (availability.kind === 'unavailable') {
      return { success: false, error: 'Game is not available for purchase' }
    }
    const pricePaid = availability.kind === 'paid' ? availability.cents : 0

    // Check if already purchased
    const existing = await payload.find({
      collection: 'purchases',
      where: {
        user: { equals: userId },
        game: { equals: gameId },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return { success: false, error: 'Already purchased' }
    }

    const activationKey = generateActivationKey()
    await payload.create({
      collection: 'purchases',
      data: { user: userId, game: gameId, pricePaid, activationKey },
    })

    // Remove from wishlist if it was there
    const wishlisted = await payload.find({
      collection: 'wishlist',
      where: { user: { equals: userId }, game: { equals: gameId } },
      limit: 1,
    })
    if (wishlisted.docs[0]) {
      await payload.delete({ collection: 'wishlist', id: wishlisted.docs[0].id })
    }

    return { success: true as const, activationKey, pricePaid }
  } catch {
    return { success: false as const, error: 'Not authenticated' }
  }
}

export async function getLibrary(locale: string = 'en') {
  const userId = await getUserId()
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'purchases',
    where: { user: { equals: userId } },
    depth: 1,
    locale: locale as 'en' | 'uk',
    limit: 100,
  })

  return result.docs
}

export async function getOwnedGameIds(): Promise<string[]> {
  try {
    const userId = await getUserId()
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'purchases',
      where: { user: { equals: userId } },
      depth: 0,
      limit: 1000,
      select: { game: true },
    })

    return result.docs
      .map((p) => {
        const game = (p as { game?: unknown }).game
        return typeof game === 'string' ? game : game ? String((game as { id?: unknown }).id ?? '') : ''
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

export async function getActivationKey(gameId: string): Promise<string | null> {
  try {
    const userId = await getUserId()
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'purchases',
      where: {
        user: { equals: userId },
        game: { equals: gameId },
      },
      limit: 1,
    })

    const purchase = result.docs[0] as
      | { id: string | number; activationKey?: string | null }
      | undefined
    if (!purchase) return null

    // Backfill: legacy purchases were created without a key — generate one on first read.
    if (!purchase.activationKey) {
      const key = generateActivationKey()
      await payload.update({
        collection: 'purchases',
        id: purchase.id,
        data: { activationKey: key },
      })
      return key
    }

    return purchase.activationKey
  } catch {
    return null
  }
}

export async function isOwned(gameId: string) {
  try {
    const userId = await getUserId()
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'purchases',
      where: {
        user: { equals: userId },
        game: { equals: gameId },
      },
      limit: 1,
    })

    return result.docs.length > 0
  } catch {
    return false
  }
}
