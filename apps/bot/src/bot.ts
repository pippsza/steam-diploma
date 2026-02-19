import { Bot } from 'grammy'
import { startCommand } from './commands/start'
import { helpCommand } from './commands/help'
import { searchCommand } from './commands/search'
import { supportCommand } from './commands/support'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required')

export const bot = new Bot(token)

// Commands
bot.command('start', startCommand)
bot.command('help', helpCommand)
bot.command('search', searchCommand)
bot.command('support', supportCommand)

// Callback queries for inline buttons
bot.callbackQuery('search', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply('Use /search <game name> to search for games.\nExample: /search Portal 2')
})

bot.callbackQuery('help', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply(
    'Steam Diploma Bot Help\n\nAvailable commands:\n/start — Start the bot\n/search <query> — Search for games\n/support <message> — Contact support\n/help — Show this help\n\nYou can also use the Mini App button to browse our game store!',
  )
})

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err)
})
