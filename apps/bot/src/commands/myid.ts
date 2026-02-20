import type { CommandContext, Context } from "grammy";

export async function myidCommand(ctx: CommandContext<Context>) {
  const chatId = ctx.chat?.id ?? ctx.from?.id;
  await ctx.reply(`Your Telegram Chat ID: <code>${chatId}</code>`, {
    parse_mode: "HTML",
  });
}
