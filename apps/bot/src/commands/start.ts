import { InlineKeyboard } from "grammy";
import type { CommandContext, Context } from "grammy";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://steam-diploma.dev";

export async function startCommand(ctx: CommandContext<Context>) {
  const keyboard = new InlineKeyboard();

  // WebApp button requires HTTPS
  if (APP_URL.startsWith("https://")) {
    keyboard.webApp("🎮 Open Store", `${APP_URL}/tma`).row();
  }

  keyboard
    .text("🔍 Search Games", "search")
    .text("❓ Help", "help");

  const lines = [
    `🎮 <b>Welcome to Steam Games Bot!</b>`,
    ``,
    `I can help you:`,
    `/search &lt;query&gt; — Search for games`,
    `/game &lt;name&gt; — Game details`,
    `/popular — Top 5 popular games`,
    `/support — Create a support ticket`,
    `/link &lt;code&gt; — Link your account`,
    `/myid — Show your chat ID`,
    `/help — Show help`,
    ``,
    `Or tap <b>Open Store</b> to browse games in the app!`,
  ].join("\n");

  await ctx.reply(lines, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}
