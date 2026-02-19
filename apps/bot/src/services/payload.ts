const API_URL = process.env.PAYLOAD_API_URL ?? 'http://localhost:3000/api'

interface GameResult {
  appid: number
  name: string
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

  static async createSupportTicket(params: {
    telegramUserId: string
    telegramUsername: string
    message: string
  }) {
    const res = await fetch(`${API_URL}/support-tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramUserId: params.telegramUserId,
        telegramUsername: params.telegramUsername,
        messages: [
          {
            from: 'user',
            text: params.message,
            createdAt: new Date().toISOString(),
          },
        ],
        status: 'open',
      }),
    })

    if (!res.ok) throw new Error(`Payload API error: ${res.status}`)
    return res.json()
  }
}
