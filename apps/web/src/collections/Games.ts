import type { CollectionConfig } from 'payload'
import { notifyWishlistDiscount } from '@/lib/telegram-notify'

const requirementsFields = [
  { name: 'minimum', type: 'textarea' as const },
  { name: 'recommended', type: 'textarea' as const },
]

export const Games: CollectionConfig = {
  slug: 'games',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async ({ operation, doc, previousDoc, req }) => {
        if (operation !== 'update') return
        const prevDiscount = previousDoc?.price?.discountPercent ?? 0
        const newDiscount = doc?.price?.discountPercent ?? 0
        // Notify only when a discount appears (was 0 or null → now > 0)
        if (prevDiscount > 0 || newDiscount <= 0) return

        try {
          // Find all wishlist entries for this game
          const wishlistEntries = await req.payload.find({
            collection: 'wishlist',
            where: { game: { equals: doc.id } },
            limit: 1000,
            depth: 1,
          })

          for (const entry of wishlistEntries.docs) {
            const user = entry.user as any
            if (user?.telegramChatId && user?.telegramLinked) {
              try {
                await notifyWishlistDiscount(user.telegramChatId, doc)
              } catch (err) {
                console.error(`Failed to notify user ${user.id}:`, err)
              }
            }
          }
        } catch (err) {
          console.error('Wishlist discount notification error:', err)
        }
      },
    ],
  },
  fields: [
    {
      name: 'appid',
      type: 'number',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      localized: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Game', value: 'game' },
        { label: 'DLC', value: 'dlc' },
        { label: 'Demo', value: 'demo' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'game',
    },
    {
      name: 'headerImage',
      type: 'text',
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'aboutTheGame',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'supportedLanguages',
      type: 'text',
    },
    {
      name: 'genres',
      type: 'array',
      fields: [
        { name: 'genreId', type: 'text' },
        { name: 'description', type: 'text' },
      ],
    },
    {
      name: 'categories',
      type: 'array',
      fields: [
        { name: 'categoryId', type: 'text' },
        { name: 'description', type: 'text' },
      ],
    },
    {
      name: 'screenshots',
      type: 'array',
      fields: [
        { name: 'url', type: 'text' },
        { name: 'thumbnailUrl', type: 'text' },
      ],
    },
    {
      name: 'releaseDate',
      type: 'text',
    },
    {
      name: 'comingSoon',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'isFree',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'price',
      type: 'group',
      fields: [
        { name: 'currency', type: 'text' },
        { name: 'initial', type: 'number' },
        { name: 'final', type: 'number' },
        { name: 'discountPercent', type: 'number', defaultValue: 0 },
      ],
    },
    {
      name: 'developers',
      type: 'array',
      fields: [{ name: 'name', type: 'text' }],
    },
    {
      name: 'publishers',
      type: 'array',
      fields: [{ name: 'name', type: 'text' }],
    },
    {
      name: 'platforms',
      type: 'group',
      fields: [
        { name: 'windows', type: 'checkbox', defaultValue: false },
        { name: 'mac', type: 'checkbox', defaultValue: false },
        { name: 'linux', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'pcRequirements',
      type: 'group',
      fields: requirementsFields,
    },
    {
      name: 'macRequirements',
      type: 'group',
      fields: requirementsFields,
    },
    {
      name: 'linuxRequirements',
      type: 'group',
      fields: requirementsFields,
    },
    {
      name: 'metacritic',
      type: 'group',
      fields: [
        { name: 'score', type: 'number' },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'recommendations',
      type: 'group',
      fields: [{ name: 'total', type: 'number' }],
    },
    {
      name: 'reviews',
      type: 'array',
      fields: [
        { name: 'reviewId', type: 'text' },
        { name: 'language', type: 'text' },
        { name: 'review', type: 'textarea' },
        { name: 'votedUp', type: 'checkbox' },
        { name: 'playtimeForever', type: 'number' },
        { name: 'timestampCreated', type: 'number' },
        { name: 'votesUp', type: 'number' },
        { name: 'votesFunny', type: 'number' },
      ],
    },
    {
      name: 'detailsFetched',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'detailsFetchedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
