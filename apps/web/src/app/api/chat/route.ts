import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import {
  streamText,
  tool,
  convertToModelMessages,
  stepCountIs,
  type LanguageModel,
} from "ai";
import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { ai } from "@/lib/tracked-ai";
import {
  getSystemPrompt,
  searchGamesToolSchema,
  navigateToolSchema,
  openGameToolSchema,
  getUserLibraryToolSchema,
  pickByMoodToolSchema,
} from "@steam-diploma/ai";

// Maps a mood to a set of genres (matched with OR) or a name keyword fallback.
const MOOD_PROFILE: Record<
  string,
  { genres?: string[]; nameKeywords?: string[]; isFree?: boolean }
> = {
  chill: { genres: ["Casual", "Simulation"] },
  intense: { genres: ["Action", "Racing"] },
  competitive: { genres: ["Sports", "Action", "Massively Multiplayer"] },
  adventurous: { genres: ["Adventure", "RPG"] },
  thoughtful: { genres: ["Strategy"] },
  creative: { genres: ["Simulation", "Indie"] },
  social: { genres: ["Massively Multiplayer", "Free To Play"] },
  nostalgic: { genres: ["Indie"] },
  scary: { nameKeywords: ["horror", "zombie", "dark", "survival", "dead"] },
  sad: { genres: ["Adventure", "Indie"] },
  happy: { genres: ["Casual", "Indie"] },
  bored: { genres: ["Action", "Adventure", "Casual"] },
};

export const maxDuration = 30;

// --- Providers ---
const openrouterKey = process.env.OPENROUTER_API_KEY;

const geminiKeys = (
  process.env.GOOGLE_GENERATIVE_AI_API_KEYS ??
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
  ""
)
  .split(",")
  .filter(Boolean);
let geminiKeyIndex = 0;

function getOpenRouterModel(): LanguageModel | null {
  if (!openrouterKey) return null;
  const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openrouterKey,
    headers: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "",
      "X-Title": "Steam Diploma",
    },
  });
  return openrouter.chat("openai/gpt-4o-mini");
}

function getGeminiModel(): LanguageModel | null {
  if (geminiKeys.length === 0) return null;
  const key = geminiKeys[geminiKeyIndex % geminiKeys.length];
  geminiKeyIndex = (geminiKeyIndex + 1) % geminiKeys.length;
  const google = createGoogleGenerativeAI({ apiKey: key });
  return google("gemini-2.0-flash");
}

// --- Rate limiter (per user, in-memory) ---
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(userId);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return new Response("Too many requests", { status: 429 });
  }

  const payload = await getPayload({ config });

  // Only verified users can use AI
  const user = await payload.findByID({
    collection: "users",
    id: session.user.id,
  });
  if (!user?.isVerified) {
    return new Response("Account not verified", { status: 403 });
  }

  const { messages: uiMessages } = await req.json();
  const messages = await convertToModelMessages(uiMessages);

  const systemPrompt = await getSystemPrompt();

  // User context
  const [favorites, library, recentSurveys] = await Promise.all([
    payload
      .find({
        collection: "favorites",
        where: { user: { equals: session.user.id } },
        depth: 1,
        limit: 20,
      })
      .then((r) =>
        r.docs
          .map((d) => (typeof d.game === "object" && d.game ? d.game.name : ""))
          .filter(Boolean),
      ),
    payload
      .find({
        collection: "purchases",
        where: { user: { equals: session.user.id } },
        depth: 1,
        limit: 20,
      })
      .then((r) =>
        r.docs
          .map((d) => (typeof d.game === "object" && d.game ? d.game.name : ""))
          .filter(Boolean),
      ),
    payload
      .find({
        collection: "mood-surveys",
        where: { user: { equals: session.user.id } },
        sort: "-createdAt",
        limit: 3,
      })
      .then((r) =>
        r.docs.map((d) =>
          [
            `mood=${d.mood}`,
            `vibe=${d.vibe}`,
            `social=${d.social}`,
            d.genre ? `genre=${d.genre}` : null,
            `sessionLength=${d.sessionLength}`,
            `novelty=${d.novelty}`,
          ]
            .filter(Boolean)
            .join(", "),
        ),
      ),
  ]);

  const surveyContext =
    recentSurveys.length > 0
      ? `Recent mood surveys (latest first):\n${recentSurveys
          .map((s, i) => `${i + 1}. ${s}`)
          .join("\n")}`
      : "Recent mood surveys: none yet";

  const systemMessage = `${systemPrompt}

User's favorite games: ${favorites.length > 0 ? favorites.join(", ") : "none yet"}
User's library (purchased): ${library.length > 0 ? library.join(", ") : "none yet"}
${surveyContext}`;

  // Pick model: OpenRouter (paid) → Gemini (free fallback)
  const model = getOpenRouterModel() ?? getGeminiModel();
  if (!model) {
    return new Response("No AI providers configured", { status: 503 });
  }

  const isPaid = !!openrouterKey;
  const modelId = isPaid ? "openai/gpt-4o-mini" : "gemini-2.0-flash";
  console.log(
    "[AI] Provider:",
    isPaid ? "OpenRouter (gpt-4o-mini)" : "Gemini (fallback)",
  );

  const trackingCtx = {
    userId: session.user.id,
    operationType: "chat",
    endpoint: "/api/chat",
    ...(!isPaid && { provider: "google" as const }),
    user: {
      email: session.user.email ?? undefined,
      name: session.user.name ?? undefined,
    },
  };

  const startTime = new Date();
  const result = streamText({
    model,
    system: systemMessage,
    messages,
    maxRetries: isPaid ? 0 : 2,
    maxOutputTokens: 1024,
    stopWhen: stepCountIs(3),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFinish: ai.onStreamFinish(modelId, trackingCtx, startTime) as any,
    tools: {
      search_games: tool({
        ...searchGamesToolSchema,
        execute: async (params) => {
          console.log("[AI tool] search_games:", JSON.stringify(params));
          const where: Record<string, any> = {};
          if (params.query) where.name = { contains: params.query };
          if (params.genre)
            where["genres.description"] = { contains: params.genre };
          if (params.is_free !== undefined)
            where.isFree = { equals: params.is_free };
          if (params.platform)
            where[`platforms.${params.platform}`] = { equals: true };

          const result = await payload.find({
            collection: "games",
            where,
            locale: "en",
            limit: params.limit ?? 6,
            sort: "-recommendations.total",
          });

          console.log("[AI tool] search_games found:", result.docs.length);
          return result.docs.map((g) => ({
            appid: g.appid,
            name: g.name,
            headerImage: g.headerImage,
            isFree: g.isFree,
            price: g.price,
            genres: g.genres?.map((gen: any) => gen.description),
          }));
        },
      }),

      navigate: tool({
        ...navigateToolSchema,
        execute: async (params) => {
          console.log("[AI tool] navigate:", JSON.stringify(params));
          return { action: "navigate", params };
        },
      }),

      open_game: tool({
        ...openGameToolSchema,
        execute: async (params) => {
          console.log("[AI tool] open_game:", JSON.stringify(params));
          let appid = params.appid;
          if (!appid) {
            // Search by name across both locales
            const found = await payload.find({
              collection: "games",
              where: { name: { contains: params.game_name } },
              locale: "en",
              limit: 1,
            });
            if (found.docs[0]) {
              appid = found.docs[0].appid;
            } else {
              // Fallback: try Ukrainian locale
              const foundUk = await payload.find({
                collection: "games",
                where: { name: { contains: params.game_name } },
                locale: "uk",
                limit: 1,
              });
              if (foundUk.docs[0]) {
                appid = foundUk.docs[0].appid;
              }
            }
          }
          console.log("[AI tool] open_game resolved appid:", appid);
          return { action: "open_game", appid, gameName: params.game_name };
        },
      }),

      pick_by_mood: tool({
        ...pickByMoodToolSchema,
        execute: async (params) => {
          console.log("[AI tool] pick_by_mood:", JSON.stringify(params));
          const profile = MOOD_PROFILE[params.mood] ?? {};
          const limit = params.limit ?? 8;

          const where: Record<string, any> = {
            detailsFetched: { equals: true },
          };
          if (profile.isFree !== undefined) {
            where.isFree = { equals: profile.isFree };
          }
          if (profile.genres?.length) {
            where.or = profile.genres.map((g) => ({
              "genres.description": { contains: g },
            }));
          }

          let docs = (
            await payload.find({
              collection: "games",
              where,
              locale: "en",
              limit,
              sort: "-recommendations.total",
            })
          ).docs;

          // Fallback to keyword search when the mood has no genre profile or returned nothing.
          if (docs.length === 0 && profile.nameKeywords?.length) {
            const keyword =
              profile.nameKeywords[
                Math.floor(Math.random() * profile.nameKeywords.length)
              ];
            docs = (
              await payload.find({
                collection: "games",
                where: {
                  detailsFetched: { equals: true },
                  name: { contains: keyword },
                },
                locale: "en",
                limit,
                sort: "-recommendations.total",
              })
            ).docs;
          }

          console.log("[AI tool] pick_by_mood found:", docs.length);
          return docs.map((g) => ({
            appid: g.appid,
            name: g.name,
            headerImage: g.headerImage,
            isFree: g.isFree,
            price: g.price,
            genres: g.genres?.map((gen: any) => gen.description),
          }));
        },
      }),

      get_user_library: tool({
        ...getUserLibraryToolSchema,
        execute: async (params) => {
          console.log("[AI tool] get_user_library:", JSON.stringify(params));
          const collection =
            params.type === "library"
              ? "purchases"
              : params.type === "favorites"
                ? "favorites"
                : "wishlist";

          const result = await payload.find({
            collection,
            where: { user: { equals: session.user!.id! } },
            locale: "en",
            depth: 1,
            limit: 50,
          });

          return result.docs
            .map((d) => {
              const game = typeof d.game === "object" && d.game ? d.game : null;
              return game ? { appid: game.appid, name: game.name } : null;
            })
            .filter(Boolean);
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
