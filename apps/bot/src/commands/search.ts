import type { CommandContext, Context } from 'grammy'
import { PayloadService } from '../services/payload'

export async function searchCommand(ctx: CommandContext<Context>) {
  const query = ctx.match?.trim()

  if (!query) {
    await ctx.reply('Usage: /search <game name>\nExample: /search Portal 2')
    return
  }

  try {
    const games = await PayloadService.searchGames(query)

    if (games.length === 0) {
      await ctx.reply(`No games found for "${query}". Try a different search term.`)
      return
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://steam-diploma.dev'
    const results = games
      .slice(0, 5)
      .map((g, i) => `${i + 1}. <b>${g.name}</b>\n   <a href="${appUrl}/uk/games/${g.appid}">View details</a>`)
      .join('\n\n')

    await ctx.reply(`Found ${games.length} games for "${query}":\n\n${results}`, {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    })
  } catch (err) {
    console.error('Search error:', err)
    await ctx.reply('Sorry, search is temporarily unavailable. Please try again later.')
  }
}
