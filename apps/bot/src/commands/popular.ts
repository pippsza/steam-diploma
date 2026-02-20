import type { CommandContext, Context } from "grammy";
import { PayloadService } from "../services/payload";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://steam-diploma.dev";

export async function popularCommand(ctx: CommandContext<Context>) {
  try {
    const games = await PayloadService.getPopularGames();

    if (games.length === 0) {
      await ctx.reply("No games found in the catalog yet.");
      return;
    }

    const lines = games.map((g, i) => {
      const price = g.isFree
        ? "Free"
        : g.price?.final
          ? `$${(g.price.final / 100).toFixed(2)}`
          : "N/A";
      const genres = g.genres?.slice(0, 2).map((gen) => gen.description).join(", ") ?? "";
      return `${i + 1}. <b>${g.name}</b>\n   💰 ${price}${genres ? ` | 🎭 ${genres}` : ""}\n   <a href="${APP_URL}/en/games/${g.appid}">View details</a>`;
    });

    await ctx.reply(`🏆 <b>Top 5 Popular Games</b>\n\n${lines.join("\n\n")}`, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.error("Popular games error:", err);
    await ctx.reply("Sorry, could not fetch popular games. Please try again later.");
  }
}
