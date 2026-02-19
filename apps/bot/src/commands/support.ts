import type { CommandContext, Context } from 'grammy'
import { PayloadService } from '../services/payload'

export async function supportCommand(ctx: CommandContext<Context>) {
  const message = ctx.match?.trim()

  if (!message) {
    await ctx.reply('Usage: /support <your message>\nExample: /support I need help with my purchase')
    return
  }

  try {
    await PayloadService.createSupportTicket({
      telegramUserId: String(ctx.from?.id ?? ''),
      telegramUsername: ctx.from?.username ?? '',
      message,
    })

    await ctx.reply('Your support ticket has been created. Our team will get back to you soon!')
  } catch (err) {
    console.error('Support ticket error:', err)
    await ctx.reply('Sorry, could not create a support ticket. Please try again later.')
  }
}
