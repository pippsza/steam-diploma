import { z } from 'zod'

export const searchGamesToolSchema = {
  description: 'Search for games and show results as game cards. Use this as the PRIMARY tool when the user asks to find, recommend, or show games. Returns game data displayed as interactive cards on the discover page.',
  inputSchema: z.object({
    query: z.string().optional().describe('Search query for game name'),
    genre: z.string().optional().describe('Filter by genre (e.g. Action, RPG, Strategy)'),
    is_free: z.boolean().optional().describe('Filter free-to-play games only'),
    platform: z.enum(['windows', 'mac', 'linux']).optional().describe('Filter by platform'),
    limit: z.number().optional().default(12).describe('Max number of results'),
  }),
}

export type SearchGamesParams = z.infer<typeof searchGamesToolSchema.inputSchema>
