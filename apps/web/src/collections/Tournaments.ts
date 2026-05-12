import type { CollectionConfig } from 'payload'

export const Tournaments: CollectionConfig = {
  slug: 'tournaments',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'game', 'startsAt', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'game',
      type: 'relationship',
      relationTo: 'games',
      index: true,
    },
    {
      name: 'logo',
      type: 'text',
      admin: { description: 'URL of tournament logo image' },
    },
    {
      name: 'banner',
      type: 'text',
      admin: { description: 'URL of wide banner image' },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'format',
      type: 'select',
      options: [
        { label: 'Single Elimination', value: 'single-elimination' },
        { label: 'Double Elimination', value: 'double-elimination' },
        { label: 'Round Robin', value: 'round-robin' },
        { label: 'Swiss', value: 'swiss' },
        { label: 'Showmatch', value: 'showmatch' },
      ],
      defaultValue: 'single-elimination',
    },
    {
      name: 'prizePool',
      type: 'number',
      admin: { description: 'Prize pool in USD' },
    },
    {
      name: 'startsAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'endsAt',
      type: 'date',
    },
    {
      name: 'signupUrl',
      type: 'text',
    },
    {
      name: 'maxParticipants',
      type: 'number',
      defaultValue: 16,
    },
    {
      name: 'organizer',
      type: 'text',
    },
    {
      name: 'location',
      type: 'text',
      admin: { description: 'e.g. "Cologne, DE" or "Online"' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'upcoming',
      options: [
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Live', value: 'live' },
        { label: 'Ended', value: 'ended' },
      ],
      index: true,
    },
  ],
}
