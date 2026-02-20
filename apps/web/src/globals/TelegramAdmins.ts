import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/lib/access'

export const TelegramAdmins: GlobalConfig = {
  slug: 'telegram-admins',
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'admins',
      type: 'array',
      fields: [
        {
          name: 'chatId',
          type: 'text',
          required: true,
          admin: {
            description: 'Telegram Chat ID (use /myid in the bot)',
          },
        },
      ],
    },
  ],
}
