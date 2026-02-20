import type { CommandContext, Context } from 'grammy'
import { PayloadService } from '../services/payload'
import { formatGameDetails } from './game'

export async function searchCommand(ctx: CommandContext<Context>) {
  const query = ctx.match?.trim()

  if (!query) {
    await ctx.reply('Usage: /search &lt;game name&gt;\nExample: /search Portal 2', {
      parse_mode: 'HTML',
    })
    return
  }

  try {
    const games = await PayloadService.searchGames(query)

    if (games.length === 0) {
      await ctx.reply(`No games found for "<b>${escapeHtml(query)}</b>". Try a different search term.`, {
        parse_mode: 'HTML',
      })
      return
    }

    // Single result — show full game details
    if (games.length === 1) {
      const details = await PayloadService.getGameDetails(games[0].name)
      if (details) {
        await ctx.reply(formatGameDetails(details), {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
        })
        return
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://steam-diploma.dev'
    const results = games
      .slice(0, 5)
      .map((g, i) => `${i + 1}. <b>${escapeHtml(g.name)}</b>\n   <a href="${appUrl}/en/games/${g.appid}">View details</a>`)
      .join('\n\n')

    await ctx.reply(`🔍 Found ${games.length} games for "<b>${escapeHtml(query)}</b>":\n\n${results}`, {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    })
  } catch (err) {
    console.error('Search error:', err)
    await ctx.reply('Sorry, search is temporarily unavailable. Please try again later.')
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
