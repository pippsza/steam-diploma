import { z } from 'zod'

export const searchGamesToolSchema = {
  description: 'Search for games by name, genre, or other criteria. Returns a list of matching games.',
  parameters: z.object({
    query: z.string().optional().describe('Search query for game name'),
    genre: z.string().optional().describe('Filter by genre (e.g. Action, RPG, Strategy)'),
    isFree: z.boolean().optional().describe('Filter free-to-play games only'),
    platform: z.enum(['windows', 'mac', 'linux']).optional().describe('Filter by platform'),
    limit: z.number().optional().default(6).describe('Max number of results'),
  }),
}

export type SearchGamesParams = z.infer<typeof searchGamesToolSchema.parameters>
