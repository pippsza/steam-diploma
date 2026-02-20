const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.warn(
    "TELEGRAM_BOT_TOKEN is not set, bot will not start. Fill it in .env to enable the bot.",
  );
  process.exit(0);
}

import { createBot } from "./bot";

async function main() {
  const bot = createBot(token!);
  console.log("Starting Steam Games Bot...");
  await bot.start({
    onStart: (botInfo) => {
      console.log(`Bot started as @${botInfo.username}`);
    },
  });
}

main().catch((err) => {
  console.error("Bot failed to start:", err);
  process.exit(1);
});
