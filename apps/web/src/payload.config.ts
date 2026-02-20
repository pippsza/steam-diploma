import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { authjsPlugin } from 'payload-authjs'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { authConfig } from './auth.config'
import { ChatSessions } from './collections/ChatSessions'
import { Favorites } from './collections/Favorites'
import { Games } from './collections/Games'
import { Media } from './collections/Media'
import { Purchases } from './collections/Purchases'
import { SupportTickets } from './collections/SupportTickets'
import { Users } from './collections/Users'
import { Wishlist } from './collections/Wishlist'
import { TelegramAdmins } from './globals/TelegramAdmins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  localization: {
    locales: ['en', 'uk'],
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [Users, Games, Favorites, Wishlist, Purchases, ChatSessions, SupportTickets, Media],
  globals: [TelegramAdmins],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || '',
  }),
  sharp,
  plugins: [
    authjsPlugin({
      authjsConfig: authConfig,
    }),
  ],
})
