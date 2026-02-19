'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth'

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user.id
}

export async function purchaseGame(gameId: string, price: number = 0) {
  const userId = await getUserId()
  const payload = await getPayload({ config })

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

  await payload.create({
    collection: 'purchases',
    data: { user: userId, game: gameId, pricePaid: price },
  })

  return { success: true }
}

export async function getLibrary() {
  const userId = await getUserId()
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'purchases',
    where: { user: { equals: userId } },
    depth: 1,
    limit: 100,
  })

  return result.docs
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
