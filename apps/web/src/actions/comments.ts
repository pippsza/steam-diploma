'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth'
import { censor } from '@/lib/profanity'

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user.id
}

export interface CommentItem {
  id: string
  content: string
  createdAt: string
  user: { id: string; name?: string | null; image?: string | null } | null
}

export async function listComments(gameId: string): Promise<CommentItem[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'comments',
    where: { game: { equals: gameId } },
    sort: '-createdAt',
    depth: 1,
    limit: 200,
  })

  return result.docs.map((doc) => {
    const user = typeof doc.user === 'object' && doc.user !== null ? doc.user : null
    return {
      id: String(doc.id),
      content: censor(String(doc.content ?? '')),
      createdAt: String(doc.createdAt),
      user: user
        ? {
            id: String(user.id),
            name: 'name' in user ? (user.name as string | null) : null,
            image: 'image' in user ? (user.image as string | null) : null,
          }
        : null,
    }
  })
}

export async function addComment(gameId: string, content: string) {
  const trimmed = content.trim()
  if (!trimmed) {
    return { success: false as const, error: 'Comment cannot be empty' }
  }
  if (trimmed.length > 2000) {
    return { success: false as const, error: 'Comment too long (max 2000 chars)' }
  }

  let userId: string
  try {
    userId = await getUserId()
  } catch {
    return { success: false as const, error: 'Not authenticated' }
  }

  const payload = await getPayload({ config })
  await payload.create({
    collection: 'comments',
    data: { user: userId, game: gameId, content: trimmed },
  })

  revalidatePath(`/[locale]/games/${gameId}`, 'page')
  return { success: true as const }
}

export async function deleteComment(commentId: string, gameId: string) {
  let userId: string
  try {
    userId = await getUserId()
  } catch {
    return { success: false as const, error: 'Not authenticated' }
  }

  const payload = await getPayload({ config })
  const existing = await payload.findByID({ collection: 'comments', id: commentId })
  const ownerId = typeof existing.user === 'object' ? existing.user.id : existing.user
  if (String(ownerId) !== String(userId)) {
    return { success: false as const, error: 'Forbidden' }
  }

  await payload.delete({ collection: 'comments', id: commentId })
  revalidatePath(`/[locale]/games/${gameId}`, 'page')
  return { success: true as const }
}
