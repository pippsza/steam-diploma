import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, chatId, username } = body as {
    token: string
    chatId: string
    username?: string
  }

  if (!token || !chatId) {
    return NextResponse.json({ error: 'Token and chatId required' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  // Find user with this token
  const { docs } = await payload.find({
    collection: 'users',
    where: { telegramLinkToken: { equals: token } },
    limit: 1,
  })

  if (docs.length === 0) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  const user = docs[0]

  // Check expiry
  const expiry = user.telegramLinkExpiry ? new Date(user.telegramLinkExpiry) : null
  if (!expiry || expiry < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 410 })
  }

  // Link the account
  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      telegramChatId: chatId,
      telegramUsername: username || undefined,
      telegramLinked: true,
      telegramLinkToken: '',
      telegramLinkExpiry: undefined,
    } as never,
  })

  return NextResponse.json({ success: true, userName: user.name })
}
