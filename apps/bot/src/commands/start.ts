import { InlineKeyboard } from 'grammy'
import type { CommandContext, Context } from 'grammy'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://steam-diploma.dev'

export async function startCommand(ctx: CommandContext<Context>) {
  const keyboard = new InlineKeyboard()
    .webApp('Open Store', `${APP_URL}/tma`)
    .row()
    .text('Search Games', 'search')
    .text('Help', 'help')

  await ctx.reply(
    `Welcome to Steam Diploma Bot! 🎮\n\nI can help you:\n• /search <query> — Search for games\n• /support — Contact support\n• /help — Show help\n\nOr tap "Open Store" to browse games in the app!`,
    { reply_markup: keyboard },
  )
}
