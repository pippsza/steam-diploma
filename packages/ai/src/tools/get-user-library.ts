import { z } from 'zod'

export const getUserLibraryToolSchema = {
  description: 'Get the current user\'s game library, favorites, or wishlist. Use this to understand what games the user already has.',
  inputSchema: z.object({
    type: z.enum(['library', 'favorites', 'wishlist']).describe('Which list to retrieve'),
  }),
}

export type GetUserLibraryParams = z.infer<typeof getUserLibraryToolSchema.inputSchema>
