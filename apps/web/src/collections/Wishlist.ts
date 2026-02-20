import type { CollectionConfig } from 'payload'

export const Wishlist: CollectionConfig = {
  slug: 'wishlist',
  access: {
    read: ({ req: { user } }) => (user ? { user: { equals: user.id } } : false),
    create: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => (user ? { user: { equals: user.id } } : false),
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'game',
      type: 'relationship',
      relationTo: 'games',
      required: true,
    },
  ],
  indexes: [
    { fields: ['user', 'game'], unique: true },
  ],
}
