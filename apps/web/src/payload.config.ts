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
import { Wishlist } from './collections/Wishlist'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Games, Favorites, Wishlist, Purchases, ChatSessions, SupportTickets, Media],
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
