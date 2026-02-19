import type { CommandContext, Context } from 'grammy'

export async function helpCommand(ctx: CommandContext<Context>) {
  await ctx.reply(
    `Steam Diploma Bot Help\n\nAvailable commands:\n/start — Start the bot\n/search <query> — Search for games\n/support <message> — Contact support\n/help — Show this help\n\nYou can also use the Mini App button to browse our game store!`,
  )
}
