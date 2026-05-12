import type { CollectionConfig } from 'payload'

export const TournamentParticipants: CollectionConfig = {
  slug: 'tournament-participants',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['tournament', 'displayName', 'team', 'placement'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => (user ? { user: { equals: user.id } } : false),
  },
  fields: [
    {
      name: 'tournament',
      type: 'relationship',
      relationTo: 'tournaments',
      required: true,
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: { description: 'Linked user, or empty for mock participants' },
    },
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    {
      name: 'avatar',
      type: 'text',
      admin: { description: 'URL of avatar image' },
    },
    {
      name: 'team',
      type: 'text',
    },
    {
      name: 'seed',
      type: 'number',
    },
    {
      name: 'placement',
      type: 'number',
      admin: { description: 'Final placement (1 = winner). Only set when tournament ends.' },
    },
    {
      name: 'isMock',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'True for seeded mock participants' },
    },
  ],
}
