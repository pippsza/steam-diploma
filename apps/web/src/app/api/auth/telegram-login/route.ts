import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''

function validateInitData(initData: string): boolean {
  if (!BOT_TOKEN || !initData) return false

  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return false

    params.delete('hash')
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('\n')

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest()

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    return computedHash === hash
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { initData } = body as { initData: string }

  if (!initData) {
    return NextResponse.json({ error: 'initData required' }, { status: 400 })
  }

  // Validate initData signature
  if (!validateInitData(initData)) {
    return NextResponse.json({ error: 'Invalid initData' }, { status: 403 })
  }

  // Parse user info from initData
  const params = new URLSearchParams(initData)
  const userJson = params.get('user')
  if (!userJson) {
    return NextResponse.json({ error: 'No user in initData' }, { status: 400 })
  }

  const tgUser = JSON.parse(userJson) as { id: number; username?: string; first_name?: string }
  const chatId = String(tgUser.id)

  // Find user by telegramChatId
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'users',
    where: {
      telegramChatId: { equals: chatId },
      telegramLinked: { equals: true },
    },
    limit: 1,
  })

  if (docs.length === 0) {
    return NextResponse.json({
      error: 'No linked account found',
      needsLink: true,
    }, { status: 404 })
  }

  const user = docs[0]

  // Return user info for client-side signIn
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  })
}
