import 'dotenv/config'
import { bot } from './bot'

async function main() {
  console.log('Starting Steam Diploma Bot...')
  await bot.start({
    onStart: (botInfo) => {
      console.log(`Bot started as @${botInfo.username}`)
    },
  })
}

main().catch((err) => {
  console.error('Bot failed to start:', err)
  process.exit(1)
})
