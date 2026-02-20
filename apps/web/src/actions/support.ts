'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getBotUsername } from '@/lib/telegram-notify'

export async function getTelegramBotUsername() {
  return getBotUsername()
}

export async function submitSupportTicket(data: {
  name: string
  email?: string
  subject: string
  message: string
  priority: string
  type: string
}) {
  const payload = await getPayload({ config })

  try {
    const ticket = await payload.create({
      collection: 'support-tickets',
      data: {
        name: data.name,
        email: data.email || undefined,
        subject: data.subject,
        message: data.message,
        priority: data.priority,
        type: data.type,
        source: 'web',
        status: 'open',
      } as never,
    })
    return { success: true, id: ticket.id }
  } catch (err) {
    console.error('Failed to create support ticket:', err)
    return { success: false, error: 'Failed to submit ticket' }
  }
}
