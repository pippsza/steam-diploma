import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, isAdminOrSelf } from '@/lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      access: {
        update: isAdminField,
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: false,
      access: {
        update: isAdminField,
      },
      admin: {
        position: 'sidebar',
        description: 'Only verified users can use the AI assistant',
      },
    },
    {
      name: 'telegramUsername',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'telegramChatId',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'telegramLinked',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'telegramLinkToken',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'telegramLinkExpiry',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
  ],
}
