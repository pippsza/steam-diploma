import type { CollectionConfig } from 'payload'

export const MoodSurveys: CollectionConfig = {
  slug: 'mood-surveys',
  admin: {
    useAsTitle: 'mood',
    defaultColumns: ['user', 'mood', 'vibe', 'social', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => (user ? { user: { equals: user.id } } : false),
    create: ({ req: { user } }) => !!user,
    update: () => false,
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
      name: 'mood',
      type: 'select',
      required: true,
      options: [
        'chill',
        'intense',
        'competitive',
        'adventurous',
        'thoughtful',
        'creative',
        'social',
        'nostalgic',
        'scary',
        'sad',
        'happy',
        'bored',
      ],
    },
    {
      name: 'vibe',
      type: 'select',
      required: true,
      options: ['relaxing', 'active'],
    },
    {
      name: 'social',
      type: 'select',
      required: true,
      options: ['solo', 'multiplayer'],
    },
    {
      name: 'genre',
      type: 'text',
      admin: { description: 'Free-form genre preference from current survey' },
    },
    {
      name: 'sessionLength',
      type: 'select',
      required: true,
      options: ['short', 'medium', 'long'],
    },
    {
      name: 'novelty',
      type: 'select',
      required: true,
      options: ['new', 'familiar'],
    },
  ],
}
