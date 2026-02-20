const API_URL = process.env.PAYLOAD_API_URL ?? 'http://localhost:3000/api'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://steam-diploma.dev'

interface GameResult {
  appid: number
  name: string
}

interface GameDetails {
  appid: number
  name: string
  shortDescription?: string
  isFree?: boolean
  price?: {
    currency?: string
    initial?: number
    final?: number
    discountPercent?: number
  }
  genres?: Array<{ description: string }>
  platforms?: { windows?: boolean; mac?: boolean; linux?: boolean }
  releaseDate?: string
}

export class PayloadService {
  static async searchGames(query: string): Promise<GameResult[]> {
    const params = new URLSearchParams({
      'where[name][contains]': query,
      limit: '10',
      sort: '-recommendations.total',
      'select[name]': 'true',
      'select[appid]': 'true',
    })

    const res = await fetch(`${API_URL}/games?${params}`)
    if (!res.ok) throw new Error(`Payload API error: ${res.status}`)

    const data = await res.json()
    return data.docs as GameResult[]
  }

  static async getPopularGames(): Promise<GameDetails[]> {
    const params = new URLSearchParams({
      limit: '5',
      sort: '-recommendations.total',
      'select[name]': 'true',
      'select[appid]': 'true',
      'select[price]': 'true',
      'select[isFree]': 'true',
      'select[genres]': 'true',
    })

    const res = await fetch(`${API_URL}/games?${params}`)
    if (!res.ok) throw new Error(`Payload API error: ${res.status}`)

    const data = await res.json()
    return data.docs as GameDetails[]
  }

  static async getGameDetails(name: string): Promise<GameDetails | null> {
    const params = new URLSearchParams({
      'where[name][contains]': name,
      limit: '1',
      'select[name]': 'true',
      'select[appid]': 'true',
      'select[shortDescription]': 'true',
      'select[price]': 'true',
      'select[isFree]': 'true',
      'select[genres]': 'true',
      'select[platforms]': 'true',
      'select[releaseDate]': 'true',
    })

    const res = await fetch(`${API_URL}/games?${params}`)
    if (!res.ok) throw new Error(`Payload API error: ${res.status}`)

    const data = await res.json()
    return data.docs.length > 0 ? (data.docs[0] as GameDetails) : null
  }

  static async createSupportTicket(params: {
    subject: string
    name: string
    message: string
    priority: string
    type: string
    telegramUserId: string
    telegramUsername: string
  }) {
    const res = await fetch(`${API_URL}/support-tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: params.subject,
        name: params.name,
        message: params.message,
        priority: params.priority,
        type: params.type,
        source: 'telegram',
        telegramUserId: params.telegramUserId,
        telegramUsername: params.telegramUsername,
        status: 'open',
      }),
    })

    if (!res.ok) throw new Error(`Payload API error: ${res.status}`)
    return res.json()
  }

  static async confirmTelegramLink(token: string, chatId: string, username?: string) {
    const res = await fetch(`${APP_URL}/api/telegram/confirm-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, chatId, username }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Link confirmation failed (${res.status}): ${text}`)
    }
    return res.json()
  }
}
