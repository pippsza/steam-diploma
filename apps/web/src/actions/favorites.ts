'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth'

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user.id
}

export async function addFavorite(gameId: string) {
  const userId = await getUserId()
  const payload = await getPayload({ config })

  try {
    await payload.create({
      collection: 'favorites',
      data: { user: userId, game: gameId },
    })
    return { success: true }
  } catch {
    return { success: false, error: 'Already in favorites' }
  }
}

export async function removeFavorite(gameId: string) {
  const userId = await getUserId()
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'favorites',
    where: {
      user: { equals: userId },
      game: { equals: gameId },
    },
    limit: 1,
  })

  if (existing.docs[0]) {
    await payload.delete({ collection: 'favorites', id: existing.docs[0].id })
  }

  return { success: true }
}

export async function getFavorites() {
  const userId = await getUserId()
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'favorites',
    where: { user: { equals: userId } },
    depth: 1,
    limit: 100,
  })

  return result.docs
}

export async function isFavorite(gameId: string) {
  try {
    const userId = await getUserId()
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'favorites',
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
