import type { CollectionConfig } from 'payload'

export const SupportTickets: CollectionConfig = {
  slug: 'support-tickets',
  admin: {
    useAsTitle: 'telegramUsername',
  },
  fields: [
    {
      name: 'telegramUserId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'telegramUsername',
      type: 'text',
    },
    {
      name: 'siteUser',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'messages',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'from',
          type: 'select',
          required: true,
          options: [
            { label: 'User', value: 'user' },
            { label: 'Support', value: 'support' },
          ],
        },
        {
          name: 'text',
          type: 'textarea',
          required: true,
        },
        {
          name: 'createdAt',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Closed', value: 'closed' },
      ],
      index: true,
    },
  ],
  timestamps: true,
}
