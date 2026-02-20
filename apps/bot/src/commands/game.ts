import type { CommandContext, Context } from "grammy";
import { PayloadService } from "../services/payload";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://steam-diploma.dev";

interface GameInfo {
  appid: number;
  name: string;
  shortDescription?: string;
  isFree?: boolean;
  price?: {
    currency?: string;
    initial?: number;
    final?: number;
    discountPercent?: number;
  };
  genres?: Array<{ description: string }>;
  platforms?: { windows?: boolean; mac?: boolean; linux?: boolean };
  releaseDate?: string;
}

export function formatGameDetails(game: GameInfo): string {
  const price = game.isFree
    ? "Free"
    : game.price?.final
      ? `$${(game.price.final / 100).toFixed(2)}`
      : "N/A";

  const discount =
    game.price?.discountPercent && game.price.discountPercent > 0
      ? ` (-${game.price.discountPercent}%)`
      : "";

  const genres =
    game.genres
      ?.slice(0, 4)
      .map((g) => g.description)
      .join(", ") ?? "N/A";

  const platforms = [
    game.platforms?.windows && "Windows",
    game.platforms?.mac && "macOS",
    game.platforms?.linux && "Linux",
  ]
    .filter(Boolean)
    .join(", ") || "N/A";

  return [
    `🎮 <b>${game.name}</b>`,
    "",
    game.shortDescription ? `${game.shortDescription.slice(0, 300)}` : "",
    "",
    `💰 Price: ${price}${discount}`,
    `🎭 Genres: ${genres}`,
    `🖥 Platforms: ${platforms}`,
    game.releaseDate ? `📅 Released: ${game.releaseDate}` : "",
    "",
    `<a href="${APP_URL}/en/games/${game.appid}">View on Steam Games</a>`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function gameCommand(ctx: CommandContext<Context>) {
  const query = ctx.match?.trim();

  if (!query) {
    await ctx.reply("Usage: /game &lt;game name&gt;\nExample: /game Portal 2", {
      parse_mode: "HTML",
    });
    return;
  }

  try {
    const game = await PayloadService.getGameDetails(query);

    if (!game) {
      await ctx.reply(`No game found for "<b>${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</b>". Try a different name.`, {
        parse_mode: "HTML",
      });
      return;
    }

    await ctx.reply(formatGameDetails(game), {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.error("Game details error:", err);
    await ctx.reply("Sorry, could not fetch game details. Please try again later.");
  }
}
