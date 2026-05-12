import type { CollectionConfig } from 'payload'

export const Purchases: CollectionConfig = {
  slug: 'purchases',
  access: {
    read: ({ req: { user } }) => (user ? { user: { equals: user.id } } : false),
    create: ({ req: { user } }) => !!user,
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
    {
      name: 'pricePaid',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Price in cents (mock)' },
    },
    {
      name: 'activationKey',
      type: 'text',
      admin: { description: 'Mock CD key in XXXXX-XXXXX-XXXXX format' },
    },
  ],
  indexes: [
    { fields: ['user', 'game'], unique: true },
  ],
}
