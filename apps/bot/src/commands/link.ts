import type { CommandContext, Context } from "grammy";
import { PayloadService } from "../services/payload";

export async function linkCommand(ctx: CommandContext<Context>) {
  const code = ctx.match?.trim();

  if (!code) {
    await ctx.reply(
      "Usage: /link &lt;code&gt;\n\nGet your 6-digit code from the <b>Settings</b> page on the website.",
      { parse_mode: "HTML" },
    );
    return;
  }

  if (!/^\d{6}$/.test(code)) {
    await ctx.reply("Invalid code. Please enter the 6-digit code from Settings.", {
      parse_mode: "HTML",
    });
    return;
  }

  const chatId = String(ctx.from?.id ?? "");
  const username = ctx.from?.username;

  try {
    const result = await PayloadService.confirmTelegramLink(code, chatId, username);
    await ctx.reply(
      `✅ <b>Account linked successfully!</b>\n\nWelcome, ${result.userName ?? "user"}! Your Telegram is now connected.`,
      { parse_mode: "HTML" },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("410") || message.includes("expired")) {
      await ctx.reply("❌ This code has expired. Please generate a new one in Settings.");
    } else if (message.includes("404")) {
      await ctx.reply("❌ Invalid code. Please check and try again.");
    } else {
      await ctx.reply("❌ Failed to link account. Please try again.");
      console.error("Link error:", err);
    }
  }
}
