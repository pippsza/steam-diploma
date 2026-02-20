import type { CommandContext, Context } from "grammy";

export async function helpCommand(ctx: CommandContext<Context>) {
  const lines = [
    `📖 <b>Steam Games Bot — Help</b>`,
    ``,
    `<b>Available commands:</b>`,
    `/start — Start the bot`,
    `/search &lt;query&gt; — Search for games`,
    `/game &lt;name&gt; — Game details &amp; info`,
    `/popular — Top 5 popular games`,
    `/support — Create a support ticket`,
    `/link &lt;code&gt; — Link your website account`,
    `/myid — Show your Telegram chat ID`,
    `/help — Show this help`,
    ``,
    `You can also use the <b>Mini App</b> button to browse our game store!`,
  ].join("\n");

  await ctx.reply(lines, { parse_mode: "HTML" });
}
