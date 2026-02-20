'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth'
import type { UIMessage } from '@ai-sdk/react'

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user.id
}

export async function getChatSessions() {
  const userId = await getUserId()
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'chat-sessions',
    where: { user: { equals: userId } },
    sort: '-updatedAt',
    limit: 50,
  })

  return result.docs.map((doc) => ({
    id: doc.id as string,
    title: (doc.title as string) || 'New Chat',
    updatedAt: doc.updatedAt as string,
  }))
}

export async function createChatSession() {
  const userId = await getUserId()
  const payload = await getPayload({ config })

  const doc = await payload.create({
    collection: 'chat-sessions',
    data: {
      user: userId,
      title: 'New Chat',
      messages: [],
    },
  })

  return { id: doc.id as string, title: doc.title as string }
}

export async function getChatSessionMessages(sessionId: string) {
  const userId = await getUserId()
  const payload = await getPayload({ config })

  const doc = await payload.findByID({
    collection: 'chat-sessions',
    id: sessionId,
  })

  if (!doc || (typeof doc.user === 'string' ? doc.user : doc.user?.id) !== userId) {
    throw new Error('Session not found')
  }

  return (doc.messages ?? []) as UIMessage[]
}

export async function saveChatMessages(sessionId: string, messages: UIMessage[]) {
  const userId = await getUserId()
  const payload = await getPayload({ config })

  // Generate title from first user message text
  const firstUserMsg = messages.find((m) => m.role === 'user')
  let title = 'New Chat'
  if (firstUserMsg) {
    const text = firstUserMsg.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
    if (text) {
      title = text.slice(0, 50) + (text.length > 50 ? '...' : '')
    }
  }

  await payload.update({
    collection: 'chat-sessions',
    id: sessionId,
    data: {
      user: userId,
      title,
      messages: messages as unknown as Record<string, unknown>[],
    },
  })
}

export async function deleteChatSession(sessionId: string) {
  const userId = await getUserId()
  const payload = await getPayload({ config })

  const doc = await payload.findByID({
    collection: 'chat-sessions',
    id: sessionId,
  })

  if (!doc || (typeof doc.user === 'string' ? doc.user : doc.user?.id) !== userId) {
    throw new Error('Session not found')
  }

  await payload.delete({
    collection: 'chat-sessions',
    id: sessionId,
  })
}
