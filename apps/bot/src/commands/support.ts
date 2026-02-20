import { InlineKeyboard } from "grammy";
import type { CommandContext, Context } from "grammy";
import { setSupportState } from "../state";

export async function supportCommand(ctx: CommandContext<Context>) {
  const userId = ctx.from?.id;
  if (!userId) return;

  setSupportState(userId, { step: "type" });

  const keyboard = new InlineKeyboard()
    .text("🐛 Bug", "support_type_bug")
    .text("❓ Question", "support_type_question")
    .row()
    .text("💡 Feature", "support_type_feature_request")
    .text("👤 Account", "support_type_account")
    .row()
    .text("📦 Other", "support_type_other");

  await ctx.reply("📋 *Create Support Ticket*\n\nStep 1/3: Choose the type of your request:", {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
}
