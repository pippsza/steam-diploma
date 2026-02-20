import { Bot } from "grammy";
import { startCommand } from "./commands/start";
import { helpCommand } from "./commands/help";
import { searchCommand } from "./commands/search";
import { supportCommand } from "./commands/support";
import { myidCommand } from "./commands/myid";
import { popularCommand } from "./commands/popular";
import { gameCommand } from "./commands/game";
import { linkCommand } from "./commands/link";
import { getSupportState, setSupportState, clearSupportState } from "./state";
import { PayloadService } from "./services/payload";
import { InlineKeyboard } from "grammy";

export function createBot(token: string) {
  const bot = new Bot(token);

  // Commands
  bot.command("start", startCommand);
  bot.command("help", helpCommand);
  bot.command("search", searchCommand);
  bot.command("support", supportCommand);
  bot.command("myid", myidCommand);
  bot.command("popular", popularCommand);
  bot.command("game", gameCommand);
  bot.command("link", linkCommand);

  // Callback queries for inline buttons
  bot.callbackQuery("search", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      "Use /search &lt;game name&gt; to search for games.\nExample: /search Portal 2",
      { parse_mode: "HTML" },
    );
  });

  bot.callbackQuery("help", async (ctx) => {
    await ctx.answerCallbackQuery();
    await helpCommand(ctx as any);
  });

  // Support flow: type selection
  bot.callbackQuery(/^support_type_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;

    const type = ctx.match[1];
    const state = getSupportState(userId);
    if (!state || state.step !== "type") {
      await ctx.reply("Session expired. Use /support to start over.");
      return;
    }

    setSupportState(userId, { step: "priority", type });

    const keyboard = new InlineKeyboard()
      .text("🟢 Low", "support_priority_low")
      .text("🟡 Medium", "support_priority_medium")
      .row()
      .text("🔴 High", "support_priority_high")
      .text("🔥 Critical", "support_priority_critical");

    await ctx.editMessageText(
      "📋 *Create Support Ticket*\n\nStep 2/3: Choose the priority:",
      { parse_mode: "Markdown", reply_markup: keyboard },
    );
  });

  // Support flow: priority selection
  bot.callbackQuery(/^support_priority_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;

    const priority = ctx.match[1];
    const state = getSupportState(userId);
    if (!state || state.step !== "priority") {
      await ctx.reply("Session expired. Use /support to start over.");
      return;
    }

    setSupportState(userId, { step: "message", type: state.type, priority });

    await ctx.editMessageText(
      "📋 *Create Support Ticket*\n\nStep 3/3: Send your message describing the issue:",
      { parse_mode: "Markdown" },
    );
  });

  // Support flow: catch text messages for the message step
  bot.on("message:text", async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const state = getSupportState(userId);
    if (!state || state.step !== "message") return next();

    const message = ctx.message.text;
    clearSupportState(userId);

    try {
      const ticket = await PayloadService.createSupportTicket({
        subject: message.slice(0, 80),
        name: ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : ""),
        message,
        priority: state.priority ?? "medium",
        type: state.type ?? "question",
        telegramUserId: String(ctx.from.id),
        telegramUsername: ctx.from.username ?? "",
      });

      await ctx.reply(
        [
          `✅ <b>Support ticket created!</b>`,
          ``,
          `📝 ID: <code>${ticket.doc?.id ?? "N/A"}</code>`,
          `📌 Type: ${state.type}`,
          `⚡ Priority: ${state.priority}`,
          ``,
          `Our team will review your request soon.`,
        ].join("\n"),
        { parse_mode: "HTML" },
      );
    } catch (err) {
      console.error("Support ticket creation error:", err);
      await ctx.reply("❌ Failed to create ticket. Please try again with /support");
    }
  });

  // Error handler
  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  return bot;
}
