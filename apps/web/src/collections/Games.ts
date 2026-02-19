import type { CollectionConfig } from 'payload'

export const Games: CollectionConfig = {
  slug: 'games',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
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
    },
    {
      name: 'detailedDescription',
      type: 'richText',
      admin: {
        condition: () => false,
      },
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
