import type { Payload } from 'payload'
import { formatPrice } from './game-status'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

let cachedBotUsername: string | null = null

export async function getBotUsername(): Promise<string> {
  if (cachedBotUsername) return cachedBotUsername
  if (!BOT_TOKEN) return 'bot'

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`)
    if (res.ok) {
      const data = await res.json()
      const username: string = data.result?.username ?? 'bot'
      cachedBotUsername = username
      return username
    }
  } catch {
    // fallback
  }
  return 'bot'
}

async function sendTelegramMessage(chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  })
  if (!res.ok) {
    console.error(`Telegram sendMessage failed for ${chatId}:`, await res.text())
  }
}

const PRIORITY_EMOJI: Record<string, string> = {
  low: '🟢',
  medium: '🟡',
  high: '🔴',
  critical: '🔥',
}

export async function notifyTelegramAdmins(
  payload: Payload,
  ticket: {
    id: string
    subject?: string
    name?: string
    priority?: string
    type?: string
    message?: string
    source?: string
  },
) {
  if (!BOT_TOKEN) return

  const global = await payload.findGlobal({ slug: 'telegram-admins' })
  const admins = (global as any)?.admins as Array<{ chatId: string }> | undefined
  if (!admins?.length) return

  const chatIds = admins.map((a) => a.chatId).filter(Boolean)
  if (chatIds.length === 0) return

  const emoji = PRIORITY_EMOJI[ticket.priority ?? 'medium'] ?? '🟡'
  const text = [
    `${emoji} <b>New Support Ticket</b>`,
    '',
    `<b>Subject:</b> ${ticket.subject ?? '—'}`,
    `<b>From:</b> ${ticket.name ?? '—'}`,
    `<b>Priority:</b> ${(ticket.priority ?? 'medium').toUpperCase()}`,
    `<b>Type:</b> ${(ticket.type ?? 'question').replace('_', ' ')}`,
    `<b>Source:</b> ${ticket.source ?? 'web'}`,
    '',
    `<b>Message:</b>`,
    (ticket.message ?? '').slice(0, 500),
    '',
    `<a href="${APP_URL}/admin/collections/support-tickets/${ticket.id}">Open in Admin</a>`,
  ].join('\n')

  await Promise.allSettled(chatIds.map((chatId) => sendTelegramMessage(chatId, text)))
}

export async function notifyWishlistDiscount(
  chatId: string,
  game: {
    name?: string
    appid?: number
    price?: { initial?: number; final?: number; currency?: string; discountPercent?: number }
  },
) {
  if (!BOT_TOKEN) return

  const currency = game.price?.currency ?? null
  const priceFinal = game.price?.final ? formatPrice(game.price.final, currency) : '?'
  const priceInitial = game.price?.initial ? formatPrice(game.price.initial, currency) : '?'
  const discount = game.price?.discountPercent ?? 0

  const text = [
    `🎮 <b>Wishlist Sale!</b>`,
    '',
    `<b>${game.name ?? 'Unknown Game'}</b> is now on sale!`,
    `💰 <s>${priceInitial}</s> → <b>${priceFinal}</b> (-${discount}%)`,
    '',
    `<a href="${APP_URL}/en/games/${game.appid}">View Game</a>`,
  ].join('\n')

  await sendTelegramMessage(chatId, text)
}
