import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ isVerified: false })
  }

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: session.user.id })

  return NextResponse.json({ isVerified: user?.isVerified ?? false })
}
